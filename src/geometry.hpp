#pragma once
#include "scene.hpp"
namespace fever {
struct Builder {
    MeshData m;
    void face(V a,V b,V c,V d,V color,int mat,float u0=0,float v0=0,float u1=1,float v1=1){
        V n=norm(cross(b-a,c-a));uint32_t k=uint32_t(m.vertices.size());
        m.vertices.insert(m.vertices.end(),{{a,n,color,float(mat),u0,v1,{}},{b,n,color,float(mat),u1,v1,{}},{c,n,color,float(mat),u1,v0,{}},{d,n,color,float(mat),u0,v0,{}}});
        m.indices.insert(m.indices.end(),{k,k+1,k+2,k,k+2,k+3});
    }
    void box(V p,V size,V color,int mat=Metal){
        V a=p-size*.5f,b=p+size*.5f;
        face({a.x,a.y,a.z},{a.x,a.y,b.z},{a.x,b.y,b.z},{a.x,b.y,a.z},color,mat);
        face({b.x,a.y,b.z},{b.x,a.y,a.z},{b.x,b.y,a.z},{b.x,b.y,b.z},color,mat);
        face({a.x,a.y,b.z},{b.x,a.y,b.z},{b.x,b.y,b.z},{a.x,b.y,b.z},color,mat);
        face({b.x,a.y,a.z},{a.x,a.y,a.z},{a.x,b.y,a.z},{b.x,b.y,a.z},color,mat);
        face({a.x,b.y,b.z},{b.x,b.y,b.z},{b.x,b.y,a.z},{a.x,b.y,a.z},color,mat);
        face({a.x,a.y,a.z},{b.x,a.y,a.z},{b.x,a.y,b.z},{a.x,a.y,b.z},color,mat);
    }
    void pipe(V a,V b,float r,float end,V color,int mat=Metal,int n=8){
        V dir=norm(b-a);V side=norm(cross(dir,std::abs(dir.y)>.83f?V{1,0,0}:V{0,1,0})),up=cross(dir,side);
        for(int i=0;i<n;i++){float t=i*2*pi/n,s=(i+1)*2*pi/n;
            V k=side*std::cos(t)+up*std::sin(t),l=side*std::cos(s)+up*std::sin(s);
            face(a+k*r,a+l*r,b+l*end,b+k*end,color,mat);}
    }
    void sign(V at,V across,float h,int which){
        float s=(which%2)*.5f,t=(which/2)*.1f;
        V v={0,h,0};face(at,at+across,at+across+v,at+v,{1,1,1},Sign,s+.001f,t+.002f,s+.499f,t+.098f);
    }
    void pool(V p,float rx,float rz,int seed){
        int n=18;for(int i=0;i<n;i++){auto pt=[&](int k){float a=k*2*pi/n;float s=.84f+.12f*std::sin(3*a+seed)+.08f*std::cos(7*a);
            return p+V{rx*s*std::cos(a),0,rz*s*std::sin(a)};};face(p,pt(i+1),pt(i),p,{.27f,.063f,.045f},Blood);}
    }
};
}
