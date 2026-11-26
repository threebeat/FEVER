#pragma once
#include <array>
#include <string>
namespace fever {
struct Surface {float tile,scale,roughness,metallic,normal,specular,emission,padding;};
using MaterialTable=std::array<Surface,15>;
MaterialTable readMaterials(const std::string& file);
}
