// Metres, left-handed world; vertical is +Y. All camera overlays are composed after the lens.
cbuffer Frame : register(b0) {
    float4 eye, side, up, ahead, projection, raster, control, motion;
    float4 lampOrigin, lampRight, lampUp, lampForward;
    float4 lightPos[8], lightColor[8];
};
cbuffer Object : register(b1) { float4 origin, axisX, axisY, axisZ, deformation, extraTracks; };
struct Material {float4 base;float4 lighting;};
cbuffer SurfaceLibrary : register(b2) { Material library[15]; };
Texture2DArray<float4> surfaces : register(t0);
Texture2D<float4> plaques : register(t1);
Texture2D<float> depthMap : register(t2);
Texture2D<float4> sceneImage : register(t3);
Texture2D<float> lastMeter : register(t4);
Texture2D<float4> letterSheet : register(t5);
Texture2D<float4> coverPhoto : register(t6);
Texture2DArray<float4> surfaceResponse : register(t7);
SamplerState tiled : register(s0);
SamplerState linearClamp : register(s1);
SamplerState nearestClamp : register(s2);
struct Vertex {float3 position:POSITION;float3 normal:NORMAL;float4 color:COLOR;float2 uv:TEXCOORD0;int4 delta:TEXCOORD1;int4 action:TEXCOORD2;int4 reaction:TEXCOORD3;int4 mechanism:TEXCOORD4;int4 idle:TEXCOORD5;};
struct World {float4 clip:SV_POSITION;float3 world:TEXCOORD0;float3 normal:TEXCOORD1;float3 color:COLOR;float3 tex:TEXCOORD2;float3 local:TEXCOORD3;float3 localNormal:TEXCOORD4;};
float3 vertexWorld(Vertex v){
    float react=saturate(deformation.w),act=min(deformation.z,1-react);
    float3 p=v.position+((1-act-react)*deformation.x*v.delta.xyz+act*v.action.xyz+react*v.reaction.xyz+extraTracks.x*v.mechanism.xyz+extraTracks.y*v.idle.xyz)/3200.0;
    float f=deformation.y;
    p.z+=f*(.23*smoothstep(.55,1.5,p.y)-.17*smoothstep(.12,.52,p.y));
    p.y-=f*min(max(p.y,0)*.47,.67);
    return origin.xyz+axisX.xyz*p.x+axisY.xyz*p.y+axisZ.xyz*p.z;
}
float4 lampClip(float3 p){
    float3 v=p-lampOrigin.xyz;float z=dot(v,lampForward.xyz);
    return float4(dot(v,lampRight.xyz)*1.68,dot(v,lampUp.xyz)*1.68,z*1.005026-.100503,z);
}
float4 shadowVS(Vertex v):SV_POSITION{return lampClip(vertexWorld(v));}
World worldVS(Vertex v){
    World o;o.world=vertexWorld(v);float3 rel=o.world-eye.xyz;float z=dot(rel,ahead.xyz);
    o.clip=float4(dot(rel,side.xyz)*projection.x,dot(rel,up.xyz)*projection.y,z*projection.z+projection.w,z);
    if(control.x>.5&&z>.1){float2 grid=raster.xy*.5;o.clip.xy=round(o.clip.xy/z*grid)/grid*z;}
    o.normal=axisX.xyz*v.normal.x+axisY.xyz*v.normal.y+axisZ.xyz*v.normal.z;
    o.color=v.color.rgb;o.tex=float3(round(v.color.a*255),v.uv);o.local=v.position;o.localNormal=v.normal;return o;
}
float visibility(float3 p,float ndl){
    float4 s=lampClip(p);if(s.w<.12||s.w>19.5)return 1;
    float3 ndc=s.xyz/s.w;float2 uv=ndc.xy*float2(.5,-.5)+.5;
    if(any(uv<.001)||any(uv>.999))return 1;
    float d=ndc.z-.00023-.00075*(1-ndl);
    float2 off=float2(.7/768,0);
    float v=(float)(d<=depthMap.SampleLevel(nearestClamp,uv+off.xy,0))+(float)(d<=depthMap.SampleLevel(nearestClamp,uv-off.xy,0));
    v+=(float)(d<=depthMap.SampleLevel(nearestClamp,uv+off.yx,0))+(float)(d<=depthMap.SampleLevel(nearestClamp,uv-off.yx,0));
    return .10+.225*v;
}
float4 worldPS(World i):SV_TARGET {
    int mat=clamp((int)round(i.tex.x),0,14);Material m=library[mat];float3 n=normalize(i.normal),view=normalize(eye.xyz-i.world);
    n=dot(n,view)<0?-n:n;
    float3 axis=abs(normalize(i.localNormal));float2 uv=axis.y>.55?i.local.xz:axis.x>axis.z?i.local.zy:i.local.xy;
    int slice=(int)m.base.x;float scale=m.base.y;
    float3 sampleColor=surfaces.Sample(tiled,float3(uv*scale,slice)).rgb;
    float grain=dot(sampleColor,float3(.28,.54,.18));
    float3 albedo=i.color*(.68+grain*.80);
    if(mat==12)albedo=plaques.Sample(linearClamp,i.tex.yz).rgb;
    if(mat==11)albedo=i.color*(.76+.19*grain);
    if(m.lighting.z>0)return float4(i.color*m.lighting.z,1);
    float cavity=saturate(.68+.29*grain+.03*i.world.y);
    float wet=m.lighting.y;float roughness=m.base.z;
    if(control.x<.5 && m.lighting.x>0){
        float4 detail=surfaceResponse.Sample(tiled,float3(uv*scale,slice));
        bool horizontal=axis.y>.55,sideWall=!horizontal&&axis.x>axis.z;
        float3 T=sideWall?axisZ.xyz:axisX.xyz,B=horizontal?axisZ.xyz:axisY.xyz;
        T=normalize(T-n*dot(n,T));B=normalize(B-n*dot(n,B)-T*dot(T,B));
        float2 slope=(detail.ga-.5)*(m.lighting.x*1.3);
        n=normalize(n-T*slope.x-B*slope.y);
        cavity*=lerp(.68,1,detail.b);
        roughness=saturate(roughness+.36*(detail.r-.5));
    }
    float rough=lerp(96,7,roughness);
    float3 reflectTint=lerp(float3(1,1,1),saturate(i.color*1.5),m.base.w);
    float3 ambient=lerp(float3(.078,.094,.11),float3(.031,.043,.048),smoothstep(-2,.8,i.world.z));
    ambient*=.65+.35*saturate(n.y*.5+.5);
    float3 lit=albedo*ambient*cavity;
    [unroll]for(int k=0;k<8;k++){
        float3 d=lightPos[k].xyz-i.world;float ds=max(.06,dot(d,d)),dist=sqrt(ds);
        float atten=saturate(1-dist/lightPos[k].w);atten=atten*atten*6.6/(1+.22*ds);
        float3 L=d/dist;float nl=saturate(dot(L,n));float spec=pow(saturate(dot(n,normalize(L+view))),rough)*wet;
        lit+=lightColor[k].rgb*atten*(albedo*(.10+.90*nl)*cavity+reflectTint*spec*.43);
    }
    float3 to=i.world-lampOrigin.xyz;float ds=max(.018,dot(to,to));float3 L=-to*rsqrt(ds);
    float nl=saturate(dot(n,L)),cosine=dot(-L,lampForward.xyz);
    float beam=smoothstep(.833,.958,cosine)*(.37+.63*smoothstep(.948,.992,cosine));
    float flashLight=control.y*beam*6.6/(1+.105*ds);
    if(flashLight>.001)lit+=float3(1,.945,.82)*visibility(i.world,nl)*flashLight*(albedo*(.15+.85*nl)+reflectTint*wet*.45*pow(saturate(dot(n,normalize(L+view))),rough));
    lit+=albedo*float3(1,.55,.22)*control.z*4.1/(1+.28*ds);
    float distanceToEye=length(i.world-eye.xyz),haze=1-exp(-distanceToEye*.010);
    return float4(lerp(lit,float3(.042,.055,.060),haze*.63),1);
}
struct Screen {float4 clip:SV_POSITION;float2 uv:TEXCOORD0;};
Screen fullVS(uint id:SV_VertexID){
    Screen o;o.uv=float2((id<<1)&2,id&2);o.clip=float4(o.uv*float2(2,-2)+float2(-1,1),0,1);return o;
}
float meterPS(Screen i):SV_TARGET {
    float weighted=0,total=0;
    [unroll]for(int y=0;y<5;y++)[unroll]for(int x=0;x<5;x++){
        float2 uv=(float2(x,y)+.5)/5;float w=1.35-length(uv-.5)*1.2;
        float lum=dot(sceneImage.SampleLevel(linearClamp,uv,0).rgb,float3(.2126,.7152,.0722));
        weighted+=w*log2(clamp(lum,.014,1.5));total+=w;
    }
    float desired=clamp(.19/exp2(weighted/total),.70,2.25);
    float old=max(.70,lastMeter.SampleLevel(nearestClamp,float2(.5,.5),0));
    return lerp(old,desired,1-exp(-motion.w*(desired<old?4.0:.95)));
}
float hash(float2 p){float3 a=frac(p.xyx*.1031);a+=dot(a,a.yzx+33.33);return frac((a.x+a.y)*a.z);}
float dither4(float2 pos){
    uint2 p=uint2(pos)&3;uint a=((p.x&1)^(p.y&1))*2+(p.y&1);
    uint b=(((p.x>>1)^(p.y>>1))&1)*2+((p.y>>1)&1);return (a*4+b+.5)/16.-.5;
}
float4 lensPS(Screen i):SV_TARGET {
    float2 center=i.uv*2-1;float r2=dot(center,center);
    float warp=control.w;float2 uv=.5+.5*center*(1+warp*r2)/(1+.86*warp);
    float2 pixel=1/raster.xy;float3 col;
    if(control.x>.5)col=sceneImage.SampleLevel(nearestClamp,uv,0).rgb;
    else{
        float2 fringe=center*pixel*.46*r2*step(.0001,warp);
        col=float3(sceneImage.SampleLevel(linearClamp,uv+fringe,0).r,sceneImage.SampleLevel(linearClamp,uv,0).g,sceneImage.SampleLevel(linearClamp,uv-fringe,0).b);
    }
    float e=lastMeter.SampleLevel(nearestClamp,float2(.5,.5),0);col*=e;
    float shoulder=dot(col,float3(.2126,.7152,.0722));
    col=col/(1+.59*shoulder);col=pow(max(col,0),.47);
    float v=dot(center+float2(motion.x*.25,0),center+float2(motion.x*.25,0));
    col*=1-smoothstep(.48,2,v)*(warp>.001?.27:.055);
    float nr=hash(floor(uv*raster.xy)+float2(floor(raster.z*17),31));
    col+=(nr-.5)*motion.y*(.008+.028*(1-saturate(shoulder)));
    float opticalDust=hash(floor(i.uv*raster.xy*.11));
    col+=step(.9984,opticalDust)*saturate(shoulder-.7)*.028*step(.001,warp);
    if(control.x>.5){col=floor(saturate(col)*31.0+dither4(floor(uv*raster.xy))+.5)/31;}
    col=lerp(col,float3(.32,.038,.02),motion.z*smoothstep(.2,1.35,r2)*.62);
    return float4(saturate(col),1);
}
struct UIIn {float2 p:POSITION;float2 uv:TEXCOORD;float4 c:COLOR;float mode:TEXCOORD1;};
struct UIOut {float4 p:SV_POSITION;float2 uv:TEXCOORD;float4 c:COLOR;float mode:TEXCOORD1;};
UIOut uiVS(UIIn i){UIOut o;o.p=float4(i.p,0,1);o.uv=i.uv;o.c=i.c;o.mode=i.mode;return o;}
float4 uiPS(UIOut i):SV_TARGET {
    if(i.mode>1.5)return coverPhoto.Sample(linearClamp,i.uv)*i.c;
    if(i.mode>.5)return letterSheet.Sample(linearClamp,i.uv)*i.c;
    return i.c;
}
