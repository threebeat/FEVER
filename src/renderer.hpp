#pragma once
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <d3d11.h>
#include <d3dcompiler.h>
#include <wincodec.h>
#include <wrl/client.h>
#include "scene.hpp"
#include "ui.hpp"
namespace fever {
using Microsoft::WRL::ComPtr;
class Renderer {
    struct Batch {ComPtr<ID3D11Buffer> v,i;UINT count=0;V center{};float radius=0;};
    struct Target {ComPtr<ID3D11RenderTargetView> r;ComPtr<ID3D11ShaderResourceView> s;};
    ComPtr<ID3D11Device> device;ComPtr<ID3D11DeviceContext> ctx;ComPtr<IDXGISwapChain> swap;
    ComPtr<ID3D11RenderTargetView> back;ComPtr<ID3D11DepthStencilView> depth,shadowDepth;
    ComPtr<ID3D11ShaderResourceView> shadow,material,surfaceResponse,labels,font,cover;
    ComPtr<IWICImagingFactory> wic;
    ComPtr<ID3D11VertexShader> worldVS,shadowVS,fullVS,uiVS;ComPtr<ID3D11PixelShader> worldPS,postPS,exposurePS,uiPS;
    ComPtr<ID3D11InputLayout> worldLayout,uiLayout;
    ComPtr<ID3D11Buffer> frameUB,objectUB,uiVB,effectsVB,effectsIB;
    ComPtr<ID3D11SamplerState> repeat,linear,point;
    ComPtr<ID3D11RasterizerState> rasterizer,shadowRasterizer;
    ComPtr<ID3D11BlendState> alpha;ComPtr<ID3D11DepthStencilState> depthOn,depthOff;
    std::map<std::string,Batch> meshes;
    Target scene,meter[2];int width=0,height=0,sw=0,sh=0,readMeter=0;float meterClock=0;bool currentPSX=false,haveSize=false;
    void rebuild(int w,int h,bool psx);
    void viewport(int w,int h);
    Target target(int w,int h,DXGI_FORMAT format);
    ComPtr<ID3D11Buffer> buffer(UINT size,UINT bind,const void* data=nullptr,bool dynamic=false);
    Batch bake(const MeshData& m);
    ComPtr<ID3D11ShaderResourceView> texture(const wchar_t* file,bool array);
    void drawBatch(const Batch& mesh,const Pose& p);
public:
    void init(HWND window,const Game& g,bool probe=false);
    void draw(HWND window,const Game& g,const Prefs& prefs,const Menu& menu,float dt);
    void writeFrame(const std::string& path);
    void present(){swap->Present(1,0);}
};
}

