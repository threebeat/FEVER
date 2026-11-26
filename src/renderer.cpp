#include "renderer.hpp"
#include "materials.hpp"
#include <fstream>
#include <sstream>
#include <iomanip>
#include <cstring>
namespace fever {
namespace {
void check(HRESULT result,const char* which){
    if(FAILED(result)){std::ostringstream s;s<<which<<" (0x"<<std::hex<<uint32_t(result)<<")";throw std::runtime_error(s.str());}
}
struct F4{float x,y,z,w;};
F4 pack(V v,float w=0){return {v.x,v.y,v.z,w};}
struct FrameBlock {F4 eye,side,up,ahead,proj,raster,control,motion,origin,lx,ly,lz,p[8],c[8];};
struct GPUVertex {V p;int8_t n[4];uint8_t c[4];uint16_t uv[2];};
struct GPUTracks {int16_t value[5][4]{};};
static_assert(sizeof(GPUVertex)==24 && sizeof(GPUTracks)==40);
GPUVertex packVertex(const Vertex& v){
    auto normal=[](float x){return int8_t(std::lround(clamp(x,-1,1)*127));};
    auto col=[](float x){return uint8_t(std::lround(clamp(x)*255));};
    return {v.p,{normal(v.n.x),normal(v.n.y),normal(v.n.z),0},
        {col(v.c.x),col(v.c.y),col(v.c.z),uint8_t(v.material)},
        {uint16_t(std::lround(clamp(v.u)*65535)),uint16_t(std::lround(clamp(v.v)*65535))}};
}
struct ObjectBlock {F4 origin,x,y,z,deform,extra;};
ComPtr<ID3DBlob> shader(const std::string& src,const char* name,const char* profile){
    ComPtr<ID3DBlob> code,errors;
    HRESULT hr=D3DCompile(src.data(),src.size(),"fever.hlsl",nullptr,nullptr,name,profile,D3DCOMPILE_OPTIMIZATION_LEVEL3,0,&code,&errors);
    if(FAILED(hr))throw std::runtime_error(std::string(name)+"\n"+(errors?static_cast<const char*>(errors->GetBufferPointer()):"HLSL compilation failed"));
    return code;
}
}
ComPtr<ID3D11Buffer> Renderer::buffer(UINT size,UINT bind,const void* data,bool dynamic){
    D3D11_BUFFER_DESC d{};d.ByteWidth=size;d.BindFlags=bind;d.Usage=dynamic?D3D11_USAGE_DYNAMIC:(data?D3D11_USAGE_IMMUTABLE:D3D11_USAGE_DEFAULT);
    d.CPUAccessFlags=dynamic?D3D11_CPU_ACCESS_WRITE:0;D3D11_SUBRESOURCE_DATA initial{};initial.pSysMem=data;ComPtr<ID3D11Buffer> b;
    check(device->CreateBuffer(&d,data?&initial:nullptr,&b),"Buffer");return b;
}
Renderer::Batch Renderer::bake(const MeshData& m){
    if(m.vertices.empty()||m.indices.empty())throw std::runtime_error("Empty model");
    V lo=m.vertices.front().p,hi=lo;
    for(const auto& v:m.vertices)for(auto p:{v.p,v.p+v.morph,v.p+v.action,v.p+v.reaction}){
        lo={std::min(lo.x,p.x),std::min(lo.y,p.y),std::min(lo.z,p.z)};
        hi={std::max(hi.x,p.x),std::max(hi.y,p.y),std::max(hi.z,p.z)};
    }
    std::vector<GPUVertex> vertices;vertices.reserve(m.vertices.size());bool animated=false;
    for(const auto& v:m.vertices){vertices.push_back(packVertex(v));
        for(auto d:{v.morph,v.action,v.reaction,v.bolt,v.idle})animated|=dot(d,d)>0;}
    Batch b;b.center=(lo+hi)*.5f;b.radius=len(hi-lo)*.5f+.25f;b.count=UINT(m.indices.size());
    b.v=buffer(UINT(vertices.size()*sizeof(GPUVertex)),D3D11_BIND_VERTEX_BUFFER,vertices.data());
    if(vertices.size()<=65536){
        std::vector<uint16_t> indices(m.indices.begin(),m.indices.end());b.indexType=DXGI_FORMAT_R16_UINT;
        b.i=buffer(UINT(indices.size()*2),D3D11_BIND_INDEX_BUFFER,indices.data());
    }else b.i=buffer(UINT(m.indices.size()*4),D3D11_BIND_INDEX_BUFFER,m.indices.data());
    if(animated){
        std::vector<GPUTracks> tracks(m.vertices.size());
        for(size_t i=0;i<m.vertices.size();i++){
            const auto& v=m.vertices[i];int t=0;
            for(auto d:{v.morph,v.action,v.reaction,v.bolt,v.idle}){
                auto& row=tracks[i].value[t++];row[0]=int16_t(std::lround(d.x*3200));row[1]=int16_t(std::lround(d.y*3200));row[2]=int16_t(std::lround(d.z*3200));
            }
        }
        b.tracks=buffer(UINT(tracks.size()*sizeof(GPUTracks)),D3D11_BIND_VERTEX_BUFFER,tracks.data());
    }
    return b;
}
ComPtr<ID3D11ShaderResourceView> Renderer::texture(const wchar_t* file,bool tiles){
    ComPtr<IWICBitmapDecoder> decoder;check(wic->CreateDecoderFromFilename(file,nullptr,GENERIC_READ,WICDecodeMetadataCacheOnLoad,&decoder),"Read image");
    ComPtr<IWICBitmapFrameDecode> frame;check(decoder->GetFrame(0,&frame),"Image frame");ComPtr<IWICFormatConverter> cv;
    check(wic->CreateFormatConverter(&cv),"Image conversion");check(cv->Initialize(frame.Get(),GUID_WICPixelFormat32bppRGBA,WICBitmapDitherTypeNone,nullptr,0,WICBitmapPaletteTypeCustom),"RGBA");
    UINT w,h;cv->GetSize(&w,&h);std::vector<uint8_t> data(size_t(w)*h*4);check(cv->CopyPixels(nullptr,w*4,UINT(data.size()),data.data()),"Image data");
    UINT ww=tiles?w/4:w,hh=tiles?h/2:h;UINT levels=1;for(UINT n=std::max(ww,hh);n>1;n/=2)levels++;
    D3D11_TEXTURE2D_DESC d{};d.Width=ww;d.Height=hh;d.MipLevels=levels;d.ArraySize=tiles?8:1;d.Format=DXGI_FORMAT_R8G8B8A8_UNORM;
    d.SampleDesc.Count=1;d.BindFlags=D3D11_BIND_SHADER_RESOURCE|D3D11_BIND_RENDER_TARGET;d.MiscFlags=D3D11_RESOURCE_MISC_GENERATE_MIPS;
    ComPtr<ID3D11Texture2D> tex;check(device->CreateTexture2D(&d,nullptr,&tex),"Image texture");
    for(UINT i=0;i<d.ArraySize;i++){
        size_t offset=tiles?(size_t(i/4)*hh*w+(i%4)*ww)*4:0;
        ctx->UpdateSubresource(tex.Get(),D3D11CalcSubresource(0,i,levels),nullptr,data.data()+offset,w*4,0);
    }
    ComPtr<ID3D11ShaderResourceView> srv;check(device->CreateShaderResourceView(tex.Get(),nullptr,&srv),"Image view");ctx->GenerateMips(srv.Get());return srv;
}
ComPtr<ID3D11ShaderResourceView> Renderer::tiledDDS(const char* file){
    std::ifstream in(file,std::ios::binary);std::array<uint32_t,37> header{};
    if(!in.read((char*)header.data(),148)||header[0]!=0x20534444||header[1]!=124||header[21]!=0x30315844||
        header[3]!=256||header[4]!=256||header[7]!=9||header[33]!=3||header[35]!=8||(header[32]!=71&&header[32]!=77))
        throw std::runtime_error(std::string("Invalid material texture ")+file);
    D3D11_TEXTURE2D_DESC desc{};desc.Width=desc.Height=256;desc.MipLevels=9;desc.ArraySize=8;desc.Format=DXGI_FORMAT(header[32]);
    desc.SampleDesc.Count=1;desc.Usage=D3D11_USAGE_IMMUTABLE;desc.BindFlags=D3D11_BIND_SHADER_RESOURCE;
    std::array<D3D11_SUBRESOURCE_DATA,72> levels{};std::array<std::vector<uint8_t>,72> payload;
    for(UINT layer=0;layer<8;layer++)for(UINT mip=0;mip<9;mip++){
        UINT i=D3D11CalcSubresource(mip,layer,9),blocks=std::max(1u,(256u>>mip)/4);
        UINT pitch=blocks*(header[32]==71?8u:16u);
        payload[i].resize(pitch*blocks);if(!in.read((char*)payload[i].data(),payload[i].size()))throw std::runtime_error(file);
        levels[i]={payload[i].data(),pitch,pitch*blocks};
    }
    ComPtr<ID3D11Texture2D> tex;check(device->CreateTexture2D(&desc,levels.data(),&tex),"Material mip chain");
    ComPtr<ID3D11ShaderResourceView> view;check(device->CreateShaderResourceView(tex.Get(),nullptr,&view),"Material array");return view;
}
Renderer::Target Renderer::target(int w,int h,DXGI_FORMAT format){
    D3D11_TEXTURE2D_DESC d{};d.Width=w;d.Height=h;d.ArraySize=d.MipLevels=d.SampleDesc.Count=1;d.Format=format;
    d.BindFlags=D3D11_BIND_RENDER_TARGET|D3D11_BIND_SHADER_RESOURCE;ComPtr<ID3D11Texture2D> tex;
    check(device->CreateTexture2D(&d,nullptr,&tex),"Camera target");Target t;check(device->CreateRenderTargetView(tex.Get(),nullptr,&t.r),"Camera view");check(device->CreateShaderResourceView(tex.Get(),nullptr,&t.s),"Camera input");return t;
}
void Renderer::init(HWND window,const Game& g,bool probe){
    DXGI_SWAP_CHAIN_DESC sc{};sc.BufferCount=2;sc.BufferDesc.Format=DXGI_FORMAT_R8G8B8A8_UNORM;sc.BufferUsage=DXGI_USAGE_RENDER_TARGET_OUTPUT;
    sc.OutputWindow=window;sc.SampleDesc.Count=1;sc.Windowed=TRUE;sc.SwapEffect=DXGI_SWAP_EFFECT_DISCARD;
    D3D_FEATURE_LEVEL fl=D3D_FEATURE_LEVEL_11_0;
    check(D3D11CreateDeviceAndSwapChain(nullptr,probe?D3D_DRIVER_TYPE_WARP:D3D_DRIVER_TYPE_HARDWARE,nullptr,0,&fl,1,D3D11_SDK_VERSION,&sc,&swap,&device,nullptr,&ctx),
        "Direct3D 11 feature level 11_0 is required. Check the Windows graphics driver");
    check(CoCreateInstance(CLSID_WICImagingFactory,nullptr,CLSCTX_INPROC_SERVER,IID_PPV_ARGS(&wic)),"Windows image decoder");
    std::ifstream file("assets/fever.hlsl",std::ios::binary);std::string src{std::istreambuf_iterator<char>(file),{}};if(src.empty())throw std::runtime_error("Missing assets/fever.hlsl");
    auto vs=[&](const char* n,ComPtr<ID3D11VertexShader>& s){auto b=shader(src,n,"vs_5_0");check(device->CreateVertexShader(b->GetBufferPointer(),b->GetBufferSize(),nullptr,&s),n);return b;};
    auto ps=[&](const char* n,ComPtr<ID3D11PixelShader>& s){auto b=shader(src,n,"ps_5_0");check(device->CreatePixelShader(b->GetBufferPointer(),b->GetBufferSize(),nullptr,&s),n);};
    auto world=vs("worldVS",worldVS);vs("shadowVS",shadowVS);vs("fullVS",fullVS);auto ui=vs("uiVS",uiVS);
    ps("worldPS",worldPS);ps("lensPS",postPS);ps("meterPS",exposurePS);ps("uiPS",uiPS);
    D3D11_INPUT_ELEMENT_DESC verts[]={
        {"POSITION",0,DXGI_FORMAT_R32G32B32_FLOAT,0,0,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"NORMAL",0,DXGI_FORMAT_R8G8B8A8_SNORM,0,12,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"COLOR",0,DXGI_FORMAT_R8G8B8A8_UNORM,0,16,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",0,DXGI_FORMAT_R16G16_UNORM,0,20,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",1,DXGI_FORMAT_R16G16B16A16_SINT,1,0,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",2,DXGI_FORMAT_R16G16B16A16_SINT,1,8,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",3,DXGI_FORMAT_R16G16B16A16_SINT,1,16,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",4,DXGI_FORMAT_R16G16B16A16_SINT,1,24,D3D11_INPUT_PER_VERTEX_DATA,0},
        {"TEXCOORD",5,DXGI_FORMAT_R16G16B16A16_SINT,1,32,D3D11_INPUT_PER_VERTEX_DATA,0}};
    check(device->CreateInputLayout(verts,9,world->GetBufferPointer(),world->GetBufferSize(),&worldLayout),"World vertex format");
    D3D11_INPUT_ELEMENT_DESC quads[]={{"POSITION",0,DXGI_FORMAT_R32G32_FLOAT,0,0,D3D11_INPUT_PER_VERTEX_DATA,0},{"TEXCOORD",0,DXGI_FORMAT_R32G32_FLOAT,0,8,D3D11_INPUT_PER_VERTEX_DATA,0},{"COLOR",0,DXGI_FORMAT_R32G32B32A32_FLOAT,0,16,D3D11_INPUT_PER_VERTEX_DATA,0},{"TEXCOORD",1,DXGI_FORMAT_R32_FLOAT,0,32,D3D11_INPUT_PER_VERTEX_DATA,0}};
    check(device->CreateInputLayout(quads,4,ui->GetBufferPointer(),ui->GetBufferSize(),&uiLayout),"Menu vertex format");
    for(auto& it:buildWorld(g))meshes.emplace(it.first,bake(it.second));
    for(auto id:{"reed-thigh","reed-shin","reed-boot","reed-coat","reed-shoulders","aircraft","rotor","bench-officer","rope-officer","patient","officer","operator","medic","medic-down","hound","sleeping-dog","infected","carbine","pistol","knife","hardware"})
        meshes.emplace(id,bake(readMesh(std::string("assets/meshes/")+id+".fvm")));
    for(auto id:{"reed-thigh","reed-shin","reed-boot","reed-coat","reed-shoulders","officer","operator","medic","medic-down","patient","hound","sleeping-dog","infected","carbine","pistol","knife"}){
        std::string key=std::string(id)+"-low";meshes.emplace(key,bake(readMesh("assets/meshes/"+key+".fvm")));
    }
    auto properties=readMaterials("assets/materials.tsv");materialUB=buffer(sizeof(properties),D3D11_BIND_CONSTANT_BUFFER,properties.data());
    material=tiledDDS("assets/surfaces.dds");surfaceResponse=tiledDDS("assets/response.dds");labels=texture(L"assets/plaques.jpg",false);font=texture(L"assets/lettering.png",false);cover=texture(L"assets/title.jpg",false);
    auto sampler=[&](D3D11_FILTER filter,D3D11_TEXTURE_ADDRESS_MODE addr,ComPtr<ID3D11SamplerState>& sampler){
        D3D11_SAMPLER_DESC d{};d.Filter=filter;d.AddressU=d.AddressV=d.AddressW=addr;d.MaxAnisotropy=4;d.ComparisonFunc=D3D11_COMPARISON_NEVER;d.MaxLOD=D3D11_FLOAT32_MAX;check(device->CreateSamplerState(&d,&sampler),"Sampler");};
    sampler(D3D11_FILTER_ANISOTROPIC,D3D11_TEXTURE_ADDRESS_WRAP,repeat);sampler(D3D11_FILTER_MIN_MAG_MIP_LINEAR,D3D11_TEXTURE_ADDRESS_CLAMP,linear);sampler(D3D11_FILTER_MIN_MAG_MIP_POINT,D3D11_TEXTURE_ADDRESS_CLAMP,point);
    D3D11_RASTERIZER_DESC rd{};rd.CullMode=D3D11_CULL_NONE;rd.FillMode=D3D11_FILL_SOLID;rd.DepthClipEnable=TRUE;
    check(device->CreateRasterizerState(&rd,&rasterizer),"Raster state");rd.DepthBias=160;rd.SlopeScaledDepthBias=1.3f;check(device->CreateRasterizerState(&rd,&shadowRasterizer),"Lamp raster state");
    D3D11_DEPTH_STENCIL_DESC dd{};dd.DepthEnable=TRUE;dd.DepthWriteMask=D3D11_DEPTH_WRITE_MASK_ALL;dd.DepthFunc=D3D11_COMPARISON_LESS_EQUAL;check(device->CreateDepthStencilState(&dd,&depthOn),"Depth");dd.DepthEnable=FALSE;check(device->CreateDepthStencilState(&dd,&depthOff),"Screen depth");
    D3D11_BLEND_DESC bd{};auto& rt=bd.RenderTarget[0];rt.BlendEnable=TRUE;rt.SrcBlend=D3D11_BLEND_SRC_ALPHA;rt.DestBlend=D3D11_BLEND_INV_SRC_ALPHA;rt.BlendOp=rt.BlendOpAlpha=D3D11_BLEND_OP_ADD;
    rt.SrcBlendAlpha=D3D11_BLEND_ONE;rt.DestBlendAlpha=D3D11_BLEND_INV_SRC_ALPHA;rt.RenderTargetWriteMask=D3D11_COLOR_WRITE_ENABLE_ALL;check(device->CreateBlendState(&bd,&alpha),"Caption blend");
    frameUB=buffer(sizeof(FrameBlock),D3D11_BIND_CONSTANT_BUFFER);objectUB=buffer(sizeof(ObjectBlock),D3D11_BIND_CONSTANT_BUFFER);
    uiVB=buffer(32000*sizeof(UIVertex),D3D11_BIND_VERTEX_BUFFER,nullptr,true);
    GPUTracks zeros{};staticTracks=buffer(sizeof(zeros),D3D11_BIND_VERTEX_BUFFER,&zeros);
    effectsVB=buffer(10000*sizeof(GPUVertex),D3D11_BIND_VERTEX_BUFFER,nullptr,true);effectsIB=buffer(18000*4,D3D11_BIND_INDEX_BUFFER,nullptr,true);
    D3D11_TEXTURE2D_DESC sd{};sd.Width=sd.Height=768;sd.ArraySize=sd.MipLevels=sd.SampleDesc.Count=1;sd.Format=DXGI_FORMAT_R24G8_TYPELESS;
    sd.BindFlags=D3D11_BIND_DEPTH_STENCIL|D3D11_BIND_SHADER_RESOURCE;ComPtr<ID3D11Texture2D> st;check(device->CreateTexture2D(&sd,nullptr,&st),"Flashlight map");
    D3D11_DEPTH_STENCIL_VIEW_DESC dv{};dv.ViewDimension=D3D11_DSV_DIMENSION_TEXTURE2D;dv.Format=DXGI_FORMAT_D24_UNORM_S8_UINT;check(device->CreateDepthStencilView(st.Get(),&dv,&shadowDepth),"Flashlight writer");
    D3D11_SHADER_RESOURCE_VIEW_DESC sv{};sv.ViewDimension=D3D11_SRV_DIMENSION_TEXTURE2D;sv.Format=DXGI_FORMAT_R24_UNORM_X8_TYPELESS;sv.Texture2D.MipLevels=1;check(device->CreateShaderResourceView(st.Get(),&sv,&shadow),"Flashlight reader");
    float one[]={1,1,1,1};for(auto& m:meter){m=target(1,1,DXGI_FORMAT_R16_FLOAT);ctx->ClearRenderTargetView(m.r.Get(),one);}
}
void Renderer::rebuild(int w,int h,bool psx){
    if(w==width&&h==height&&haveSize&&psx==currentPSX)return;
    ctx->OMSetRenderTargets(0,nullptr,nullptr);
    if(!haveSize||w!=width||h!=height){back.Reset();check(swap->ResizeBuffers(0,w,h,DXGI_FORMAT_UNKNOWN,0),"Display resize");
        ComPtr<ID3D11Texture2D> t;check(swap->GetBuffer(0,IID_PPV_ARGS(&t)),"Display buffer");check(device->CreateRenderTargetView(t.Get(),nullptr,&back),"Display view");}
    width=w;height=h;haveSize=true;currentPSX=psx;sh=psx?std::min(h,300):h;sw=std::max(1,int(float(w)*sh/h));
    scene=target(sw,sh,DXGI_FORMAT_R16G16B16A16_FLOAT);
    D3D11_TEXTURE2D_DESC d{};d.Width=sw;d.Height=sh;d.ArraySize=d.MipLevels=d.SampleDesc.Count=1;d.Format=DXGI_FORMAT_D24_UNORM_S8_UINT;d.BindFlags=D3D11_BIND_DEPTH_STENCIL;
    ComPtr<ID3D11Texture2D> t;check(device->CreateTexture2D(&d,nullptr,&t),"Scene depth texture");depth.Reset();check(device->CreateDepthStencilView(t.Get(),nullptr,&depth),"Scene depth view");
}
void Renderer::viewport(int w,int h){D3D11_VIEWPORT vp{0,0,float(w),float(h),0,1};ctx->RSSetViewports(1,&vp);}
void Renderer::drawBatch(const Batch& b,const Pose& p){
    ObjectBlock ob{pack(p.p),pack(p.x),pack(p.y),pack(p.z),{p.morph,p.kneel,p.action,p.reaction},{p.bolt,p.idle,0,0}};
    ctx->UpdateSubresource(objectUB.Get(),0,nullptr,&ob,0,0);UINT strides[]={sizeof(GPUVertex),b.tracks?UINT(sizeof(GPUTracks)):0u},offsets[]={0,0};
    ID3D11Buffer* buffers[]={b.v.Get(),b.tracks?b.tracks.Get():staticTracks.Get()};
    ctx->IASetVertexBuffers(0,2,buffers,strides,offsets);ctx->IASetIndexBuffer(b.i.Get(),b.indexType,0);ctx->DrawIndexed(b.count,0,0);
}
void Renderer::draw(HWND window,const Game& g,const Prefs& prefs,const Menu& menu,float dt){
    RECT rc;GetClientRect(window,&rc);if(rc.right<=0||rc.bottom<=0)return;rebuild(rc.right,rc.bottom,prefs.psx);
    ID3D11ShaderResourceView* empty[8]={};ctx->PSSetShaderResources(0,8,empty);
    ID3D11SamplerState* ss[]={repeat.Get(),linear.Get(),point.Get()};ctx->PSSetSamplers(0,3,ss);
    bool game=menu.page==Page::Playing||menu.page==Page::Pause||menu.page==Page::Lost||menu.page==Page::Filed||((menu.page==Page::Options||menu.page==Page::Controls)&&menu.back==Page::Pause);
    ctx->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);ctx->RSSetState(rasterizer.Get());
    float clear[]={.022f,.031f,.039f,1};ctx->OMSetBlendState(nullptr,nullptr,~0u);
    if(game){
        V az=forward(g.camYaw,g.camPitch),ax=right(g.camYaw),ay=norm(cross(az,ax)),rx=ax*std::cos(g.camRoll)+ay*std::sin(g.camRoll),ry=norm(cross(az,rx));
        V light=g.camera+right(g.yaw)*.077f+V{0,.055f,0},lz=g.aimRay(),lx=right(g.yaw),ly=norm(cross(lz,lx));
        float aspect=float(sw)/sh,hfov=mix(g.tuning.fov,86,g.aim)*pi/180,sx=1/std::tan(hfov/2);FrameBlock frame{};
        frame.eye=pack(g.camera);frame.side=pack(rx);frame.up=pack(ry);frame.ahead=pack(az);frame.proj={sx,sx*aspect,100.f/99.965f,-3.5f/99.965f};
        frame.raster={float(sw),float(sh),g.time,0};frame.control={prefs.psx?1.f:0.f,g.torch?1.f:0.f,g.flash,prefs.lens?g.tuning.warp:0.f};
        frame.motion={g.camRoll,prefs.grain?1.f:0.f,g.damageFlash,0};frame.origin=pack(light);frame.lx=pack(lx);frame.ly=pack(ly);frame.lz=pack(lz);
        static const auto lights=lamps();for(int i=0;i<8;i++){frame.p[i]=pack(lights[i].p,lights[i].range);frame.c[i]=pack(lights[i].color);}
        if(g.stage==Stage::Flight){frame.p[7]=pack(g.craft()+V{.41f,1.39f,.28f},3.2f);frame.c[7]={.88f,.055f,.025f,0};}
        meterClock+=dt;frame.motion.w=meterClock;ctx->UpdateSubresource(frameUB.Get(),0,nullptr,&frame,0,0);
        ID3D11Buffer* cb[]={frameUB.Get(),objectUB.Get()};ctx->VSSetConstantBuffers(0,2,cb);ctx->PSSetConstantBuffers(0,2,cb);ctx->PSSetConstantBuffers(2,1,materialUB.GetAddressOf());
        ctx->IASetInputLayout(worldLayout.Get());ctx->OMSetDepthStencilState(depthOn.Get(),0);
        auto drawList=[&](bool shadowPass){
            for(const auto& inst:sceneInstances(g,shadowPass)){
                auto it=meshes.find(inst.id);const auto& b=it->second;const auto& p=inst.pose;
                V center=p.p+p.x*b.center.x+p.y*b.center.y+p.z*b.center.z;
                V rel=center-(shadowPass?light:g.camera);
                float z=dot(rel,shadowPass?lz:az),x=std::abs(dot(rel,shadowPass?lx:rx)),y=std::abs(dot(rel,shadowPass?ly:ry));
                float fx=shadowPass?1.68f:sx,fy=shadowPass?1.68f:sx*aspect;
                if(z+b.radius<.03f||z-b.radius>(shadowPass?20.f:100.f)||
                   x*fx-z>b.radius*std::sqrt(fx*fx+1)||y*fy-z>b.radius*std::sqrt(fy*fy+1))continue;
                bool low=prefs.psx;
                if(inst.lodKey){
                    low=lowDetailFor(lowLast[inst.lodKey],prefs.psx,len(center-g.camera),b.radius,sx,sw);
                    lowLast[inst.lodKey]=low;
                }
                if(low){
                    auto low=meshes.find(inst.id+"-low");if(low!=meshes.end())it=low;
                }
                drawBatch(it->second,p);
            }
        };
        if(g.torch){
            viewport(768,768);ctx->RSSetState(shadowRasterizer.Get());ctx->OMSetRenderTargets(0,nullptr,shadowDepth.Get());ctx->ClearDepthStencilView(shadowDepth.Get(),D3D11_CLEAR_DEPTH,1,0);
            ctx->VSSetShader(shadowVS.Get(),nullptr,0);ctx->PSSetShader(nullptr,nullptr,0);drawList(true);
        }
        ctx->RSSetState(rasterizer.Get());viewport(sw,sh);ctx->OMSetRenderTargets(1,scene.r.GetAddressOf(),depth.Get());
        ctx->ClearRenderTargetView(scene.r.Get(),clear);ctx->ClearDepthStencilView(depth.Get(),D3D11_CLEAR_DEPTH,1,0);ctx->VSSetShader(worldVS.Get(),nullptr,0);ctx->PSSetShader(worldPS.Get(),nullptr,0);
        ID3D11ShaderResourceView* table[]={material.Get(),labels.Get(),shadow.Get()};ctx->PSSetShaderResources(0,3,table);ctx->PSSetShaderResources(7,1,surfaceResponse.GetAddressOf());drawList(false);
        auto fx=effectsMesh(g);
        auto upload=[&](ID3D11Buffer* b,const void* src,size_t bytes){D3D11_MAPPED_SUBRESOURCE mapped;
            check(ctx->Map(b,0,D3D11_MAP_WRITE_DISCARD,0,&mapped),"Stream geometry");std::memcpy(mapped.pData,src,bytes);ctx->Unmap(b,0);};
        if(!fx.indices.empty()&&fx.vertices.size()<=10000&&fx.indices.size()<=18000){D3D11_MAPPED_SUBRESOURCE v;check(ctx->Map(effectsVB.Get(),0,D3D11_MAP_WRITE_DISCARD,0,&v),"Effect vertices");
            auto* dst=static_cast<GPUVertex*>(v.pData);for(const auto& a:fx.vertices)*dst++=packVertex(a);ctx->Unmap(effectsVB.Get(),0);upload(effectsIB.Get(),fx.indices.data(),fx.indices.size()*4);
            drawBatch({effectsVB,effectsIB,UINT(fx.indices.size())},{});}
        ctx->IASetInputLayout(nullptr);ctx->VSSetShader(fullVS.Get(),nullptr,0);ctx->OMSetDepthStencilState(depthOff.Get(),0);
        ctx->OMSetRenderTargets(0,nullptr,nullptr);ctx->PSSetShaderResources(3,1,scene.s.GetAddressOf());
        if(meterClock>=1.f/30){int next=1-readMeter;ctx->OMSetRenderTargets(1,meter[next].r.GetAddressOf(),nullptr);
            ctx->PSSetShaderResources(4,1,meter[readMeter].s.GetAddressOf());viewport(1,1);ctx->PSSetShader(exposurePS.Get(),nullptr,0);ctx->Draw(3,0);readMeter=next;meterClock=0;}
        ctx->OMSetRenderTargets(1,back.GetAddressOf(),nullptr);viewport(width,height);ctx->PSSetShaderResources(4,1,meter[readMeter].s.GetAddressOf());ctx->PSSetShader(postPS.Get(),nullptr,0);ctx->Draw(3,0);
    }else{ctx->OMSetRenderTargets(1,back.GetAddressOf(),nullptr);viewport(width,height);ctx->ClearRenderTargetView(back.Get(),clear);}
    if(menu.vertices.empty())return;if(menu.vertices.size()>32000)throw std::runtime_error("Menu batch exhausted");
    D3D11_MAPPED_SUBRESOURCE v;check(ctx->Map(uiVB.Get(),0,D3D11_MAP_WRITE_DISCARD,0,&v),"Menu upload");std::memcpy(v.pData,menu.vertices.data(),menu.vertices.size()*sizeof(UIVertex));ctx->Unmap(uiVB.Get(),0);
    ctx->OMSetDepthStencilState(depthOff.Get(),0);ctx->OMSetBlendState(alpha.Get(),nullptr,~0u);ctx->IASetInputLayout(uiLayout.Get());UINT stride=sizeof(UIVertex),off=0;ctx->IASetVertexBuffers(0,1,uiVB.GetAddressOf(),&stride,&off);
    ID3D11ShaderResourceView* art[]={font.Get(),cover.Get()};ctx->PSSetShaderResources(5,2,art);ctx->VSSetShader(uiVS.Get(),nullptr,0);ctx->PSSetShader(uiPS.Get(),nullptr,0);ctx->Draw(UINT(menu.vertices.size()),0);
}
void Renderer::writeFrame(const std::string& path){
    ComPtr<ID3D11Texture2D> t;check(swap->GetBuffer(0,IID_PPV_ARGS(&t)),"Read frame");D3D11_TEXTURE2D_DESC d{};t->GetDesc(&d);d.Usage=D3D11_USAGE_STAGING;d.BindFlags=0;d.CPUAccessFlags=D3D11_CPU_ACCESS_READ;d.MiscFlags=0;
    ComPtr<ID3D11Texture2D> dest;check(device->CreateTexture2D(&d,nullptr,&dest),"Readback");ctx->CopyResource(dest.Get(),t.Get());D3D11_MAPPED_SUBRESOURCE m;
    check(ctx->Map(dest.Get(),0,D3D11_MAP_READ,0,&m),"Frame capture");
    std::ofstream f(path,std::ios::binary);f<<"P6\n"<<d.Width<<" "<<d.Height<<"\n255\n";int lo=255,hi=0;
    for(UINT y=0;y<d.Height;y++){auto row=static_cast<const uint8_t*>(m.pData)+y*m.RowPitch;for(UINT x=0;x<d.Width;x++){auto rgb=row+4*x;f.write((const char*)rgb,3);lo=std::min(lo,int(rgb[1]));hi=std::max(hi,int(rgb[1]));}}
    ctx->Unmap(dest.Get(),0);if(!f||hi-lo<35)throw std::runtime_error("Camera verification produced an empty frame");
}
}

