#pragma once
#include "game.hpp"
namespace fever {
bool loadTuning(const std::string& file,Tuning& tuning);
V steer(const Game& game,V from,V goal,Brain& brain,float dt);
void updatePatrol(Game& game,int i,float dt);
void advanceHost(Game& game,float dt);
}

