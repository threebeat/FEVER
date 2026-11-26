#include "materials.hpp"
#include <fstream>
#include <sstream>
#include <stdexcept>
#include <cmath>
namespace fever {
MaterialTable readMaterials(const std::string& path){
    const std::array<std::string,17> names={"plaster","wood","metal","fabric","hide","aggregate","enamel","stone","warm","cold","red","blood","sign","dark-glass","paper","polymer","skin"};
    MaterialTable table{};size_t index=0;std::ifstream input(path);std::string line;
    while(std::getline(input,line)){
        std::istringstream row(line.substr(0,line.find('#')));std::string name,tail;
        if(!(row>>name))continue;
        Surface s{};
        if(index>=names.size()||name!=names[index]||!(row>>s.tile>>s.scale>>s.roughness>>s.metallic>>s.normal>>s.specular>>s.emission)||(row>>tail))
            throw std::runtime_error("Invalid material row "+name);
        auto unit=[](float x){return x>=0&&x<=1;};
        if(s.tile<0||s.tile>7||s.tile!=std::floor(s.tile)||!(s.scale>0&&s.scale<32)||!unit(s.roughness)||!unit(s.metallic)||!unit(s.normal)||!unit(s.specular)||!(s.emission>=0&&s.emission<12))
            throw std::runtime_error("Invalid material coefficients for "+name);
        table[index++]=s;
    }
    if(index!=names.size())throw std::runtime_error("Incomplete material library "+path);
    return table;
}
}
