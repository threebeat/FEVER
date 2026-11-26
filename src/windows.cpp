#include <cstdio>
#include "renderer.hpp"
#include "audio.hpp"
#include "behavior.hpp"
#include <mmsystem.h>
#include <xinput.h>
#include <atomic>
#include <fstream>
#include <thread>
#include <mutex>
#include <filesystem>
#include <cstdio>
namespace fs=std::filesystem;
using namespace fever;
namespace {
struct Keys {
    bool down[256]{},tap[256]{},mouse=false,right=false,click=false,escape=false,focused=true,locked=false,moved=false;
    int rawX=0,rawY=0,mouseX=0,mouseY=0,wheel=0;
    void edges(){std::fill(std::begin(tap),std::end(tap),false);click=escape=moved=false;rawX=rawY=wheel=0;}
    void release(){std::fill(std::begin(down),std::end(down),false);mouse=right=false;edges();}
} keys;
bool quit=false;
LRESULT CALLBACK windowProc(HWND w,UINT m,WPARAM a,LPARAM b){
    switch(m){
    case WM_CLOSE:quit=true;return 0;case WM_DESTROY:PostQuitMessage(0);return 0;
    case WM_ERASEBKGND:return 1;
    case WM_SETFOCUS:keys.focused=true;return 0;
    case WM_KILLFOCUS:keys.focused=false;keys.release();ClipCursor(nullptr);return 0;
    case WM_KEYDOWN:case WM_SYSKEYDOWN:if(a<256){if(!keys.down[a])keys.tap[a]=true;keys.down[a]=true;if(a==VK_ESCAPE)keys.escape=true;}if(m==WM_SYSKEYDOWN&&a==VK_F4)quit=true;return 0;
    case WM_KEYUP:case WM_SYSKEYUP:if(a<256)keys.down[a]=false;return 0;
    case WM_MOUSEMOVE:keys.mouseX=(short)LOWORD(b);keys.mouseY=(short)HIWORD(b);keys.moved=true;return 0;
    case WM_LBUTTONDOWN:keys.mouse=true;keys.click=true;return 0;case WM_LBUTTONUP:keys.mouse=false;return 0;
    case WM_RBUTTONDOWN:keys.right=true;return 0;case WM_RBUTTONUP:keys.right=false;return 0;
    case WM_MOUSEWHEEL:keys.wheel+=GET_WHEEL_DELTA_WPARAM(a)/WHEEL_DELTA;return 0;
    case WM_SETCURSOR:if(LOWORD(b)==HTCLIENT){SetCursor(keys.locked?nullptr:LoadCursor(nullptr,IDC_ARROW));return TRUE;}break;
    case WM_INPUT:{RAWINPUT r{};UINT n=sizeof r;
        if(GetRawInputData((HRAWINPUT)b,RID_INPUT,&r,&n,sizeof(RAWINPUTHEADER))==n&&r.header.dwType==RIM_TYPEMOUSE&&keys.locked){
            keys.rawX+=r.data.mouse.lLastX;keys.rawY+=r.data.mouse.lLastY;}break;}
    }return DefWindowProcW(w,m,a,b);
}
void lockMouse(HWND w,bool yes){
    if(keys.locked==yes)return;keys.locked=yes;
    if(yes){RECT r;GetClientRect(w,&r);MapWindowPoints(w,nullptr,reinterpret_cast<POINT*>(&r),2);ClipCursor(&r);SetCursor(nullptr);}
    else{ClipCursor(nullptr);SetCursor(LoadCursor(nullptr,IDC_ARROW));}
}
struct Pad {
    using Poll=DWORD(WINAPI*)(DWORD,XINPUT_STATE*);HMODULE lib=nullptr;Poll read=nullptr;
    XINPUT_STATE state{};WORD before=0,pressed=0;bool live=false,trigger=false,triggerPressed=false;
    Pad(){for(const wchar_t* n:{L"xinput1_4.dll",L"xinput9_1_0.dll",L"xinput1_3.dll"}){lib=LoadLibraryW(n);if(lib){read=(Poll)GetProcAddress(lib,"XInputGetState");if(read)break;FreeLibrary(lib);lib=nullptr;}}}
    ~Pad(){if(lib)FreeLibrary(lib);}
    void poll(){before=state.Gamepad.wButtons;state={};live=read&&read(0,&state)==ERROR_SUCCESS;pressed=state.Gamepad.wButtons&~before;bool held=trigger;trigger=live&&state.Gamepad.bRightTrigger>(held?32:45);triggerPressed=trigger&&!held;}
    static V stick(SHORT x,SHORT y,float dead){return radialStick(x/32768.f,y/32768.f,dead);}
};
struct Saved {
    Prefs prefs;int cp=-1,call=0,beat=0;fs::path path;
    Saved(){
        wchar_t base[32768];DWORD n=GetEnvironmentVariableW(L"LOCALAPPDATA",base,32768);if(!n||n>=32768)return;
        path=fs::path(base)/L"FEVER"/L"shift.dat";std::ifstream f(path);
        int ver,checkpoint,ps,st,gr,le,night;float vol;
        if(f>>ver>>checkpoint>>ps>>st>>gr>>le>>night>>vol && (ver==1||ver==2)){
            if(checkpoint==-1||checkpoint==int(Stage::Flight)||checkpoint==int(Stage::Apron)||checkpoint==int(Stage::Kennels)||checkpoint==int(Stage::Recovery)||checkpoint==int(Stage::Report))cp=checkpoint;
            prefs={bool(ps),bool(st),bool(gr),bool(le),bool(night),clamp(vol)};
            if(ver==2&&f>>call>>beat>>prefs.look>>prefs.padLook>>prefs.deadzone){
                call=std::clamp(call,0,2);beat=std::clamp(beat,0,5);prefs.look=clamp(prefs.look,.4f,2);prefs.padLook=clamp(prefs.padLook,.4f,2);prefs.deadzone=clamp(prefs.deadzone,.04f,.30f);
            }
        }
    }
    void write(){
        if(path.empty())return;std::error_code ec;fs::create_directories(path.parent_path(),ec);fs::path tmp=path;tmp+=std::to_string(GetCurrentProcessId())+".tmp";
        {std::ofstream f(tmp);f<<2<<" "<<cp<<" "<<prefs.psx<<" "<<prefs.steady<<" "<<prefs.grain<<" "<<prefs.lens<<" "<<prefs.nightMix<<" "<<prefs.volume<<" "<<call<<" "<<beat<<" "<<prefs.look<<" "<<prefs.padLook<<" "<<prefs.deadzone<<"\n";f.close();if(!f)return;}
        MoveFileExW(tmp.c_str(),path.c_str(),MOVEFILE_REPLACE_EXISTING|MOVEFILE_WRITE_THROUGH);
    }
};
class Output {
    static constexpr int count=4,frames=512;std::array<std::array<int16_t,frames*2>,count> samples{};std::array<WAVEHDR,count> headers{};
    HWAVEOUT dev=nullptr;std::atomic<bool> running{false};std::thread worker;std::mutex mutex;MixState state;bool paused=false,reset=false;
    std::vector<Event> pending;Mixer& mix;
public:
    explicit Output(Mixer& m):mix(m){
        WAVEFORMATEX format{WAVE_FORMAT_PCM,2,48000,192000,4,16,0};
        if(waveOutOpen(&dev,WAVE_MAPPER,&format,0,0,CALLBACK_NULL)!=MMSYSERR_NOERROR){dev=nullptr;return;}
        for(int i=0;i<count;i++){headers[i].lpData=(LPSTR)samples[i].data();headers[i].dwBufferLength=frames*4;
            if(waveOutPrepareHeader(dev,&headers[i],sizeof(WAVEHDR))!=MMSYSERR_NOERROR){for(int j=0;j<i;j++)waveOutUnprepareHeader(dev,&headers[j],sizeof(WAVEHDR));waveOutClose(dev);dev=nullptr;return;}}
        running=true;worker=std::thread([this]{
            size_t cursor=0;std::vector<Event> batch;batch.reserve(64);
            while(running){auto& h=headers[cursor];
                if(h.dwFlags&WHDR_INQUEUE){Sleep(2);continue;}
                MixState s;bool silent,clear;{std::lock_guard<std::mutex> g(mutex);s=state;silent=paused;clear=reset;reset=false;batch.swap(pending);}
                if(clear)mix.clear();for(auto& e:batch)mix.play(e);batch.clear();
                if(silent)samples[cursor].fill(0);else mix.render(samples[cursor].data(),frames,s);
                waveOutWrite(dev,&h,sizeof h);cursor=(cursor+1)%count;
            }
        });
    }
    void update(Game& g,const Prefs& prefs,bool active,bool freeze,bool flush=false){
        std::lock_guard<std::mutex> guard(mutex);state=mixState(g,prefs,active);paused=freeze;reset|=flush;
        if(flush)pending.clear();if(dev){pending.insert(pending.end(),g.events.begin(),g.events.end());}g.events.clear();
    }
    ~Output(){running=false;if(worker.joinable())worker.join();if(dev){waveOutReset(dev);for(auto& h:headers)waveOutUnprepareHeader(dev,&h,sizeof h);waveOutClose(dev);}}
};
void screenshotProof(HWND window,Renderer& r,Game& g){
    fs::create_directories("proof");Menu m;Prefs p;m.build(g,p,false,16.f/9,0,false);r.draw(window,g,p,m,.04f);r.writeFrame("proof/title.ppm");
    g.restart(Stage::Kennels);g.pos={-.5f,0,20.8f};g.yaw=-.25f;g.pitch=-.03f;
    for(int i=0;i<50;i++)g.tick({},p,1.f/90);
    m.page=Page::Playing;
    for(int mode=0;mode<2;mode++){p.psx=mode!=0;m.build(g,p,true,16.f/9,1,false);
        for(int i=0;i<8;i++)r.draw(window,g,p,m,.1f);
        r.writeFrame(std::string("proof/")+(p.psx?"psx":"photo")+".ppm");}
    p.psx=false;g.pitch=-1.39f;
    for(int j=0;j<70;j++)g.tick({},p,1.f/90);
    m.build(g,p,true,16.f/9,1,false);r.draw(window,g,p,m,.04f);r.writeFrame("proof/standing-body.ppm");
    Input down;down.crouch=true;for(int j=0;j<65;j++)g.tick(down,p,1.f/90);
    m.build(g,p,true,16.f/9,1,false);r.draw(window,g,p,m,.04f);r.writeFrame("proof/crouching-body.ppm");
    auto capture=[&](const char* label){for(int i=0;i<8;i++){m.build(g,p,true,16.f/9,1,false);r.draw(window,g,p,m,.08f);}r.writeFrame(std::string("proof/")+label+".ppm");};
    for(auto rec:{Recording::Animal,Recording::House,Recording::Grey}){
        g.start(rec);for(int i=0;i<(rec==Recording::Animal?540:306);i++)g.tick({},p,1.f/90);capture(rec==Recording::Animal?"michigan-patrol":rec==Recording::House?"louisiana-patrol":"vermont-patrol");
        if(rec==Recording::Animal){p.psx=true;capture("michigan-passenger-psx");p.psx=false;}
        g.start(rec,rec==Recording::Animal?Stage::Report:Stage::Apron,rec==Recording::House?2:rec==Recording::Grey?2:0);
        if(rec==Recording::Animal)g.pos={.5f,0,61};for(int j=0;j<71;j++)g.tick({},p,1.f/90);
        capture(rec==Recording::Animal?"lake-street":rec==Recording::House?"alder-kitchen":"north-spur");}
    g.start(Recording::Range,Stage::Apron);g.choose(3);for(int j=0;j<60;j++)g.tick({},p,1.f/90);capture("training-annex");g.start(Recording::Animal);

}
int run(HINSTANCE instance,const std::string& args){
    wchar_t file[32768];DWORD n=GetModuleFileNameW(nullptr,file,32768);if(!n||n==32768)throw std::runtime_error("Executable path unavailable");fs::current_path(fs::path(file).parent_path());
    SetProcessDPIAware();CoInitializeEx(nullptr,COINIT_APARTMENTTHREADED);
    WNDCLASSW wc{};wc.style=CS_OWNDC;wc.lpfnWndProc=windowProc;wc.hInstance=instance;wc.lpszClassName=L"FeverNativeWindow";wc.hCursor=LoadCursor(nullptr,IDC_ARROW);RegisterClassW(&wc);
    bool proof=args.find("--verify")!=std::string::npos;
    bool bench=args.find("--benchmark")!=std::string::npos;
    int winW=bench?1920:proof?960:std::min(1440,GetSystemMetrics(SM_CXSCREEN)*9/10),winH=winW*9/16;if(!bench)winH=std::min(winH,GetSystemMetrics(SM_CYSCREEN)*85/100);
    RECT rect{0,0,winW,winH};AdjustWindowRect(&rect,WS_OVERLAPPEDWINDOW,FALSE);
    HWND window=CreateWindowW(wc.lpszClassName,L"FEVER",WS_OVERLAPPEDWINDOW,CW_USEDEFAULT,CW_USEDEFAULT,rect.right-rect.left,rect.bottom-rect.top,nullptr,nullptr,instance,nullptr);
    if(!window)throw std::runtime_error("Cannot open the FEVER window");
    Game g(readScript("docs/DIALOGUE.md"));if(g.script.size()!=38)throw std::runtime_error("Missing FEVER recording script");
    if(!loadTuning("assets/shift.cfg",g.tuning))throw std::runtime_error("Invalid assets/shift.cfg");
    Mixer mixer;mixer.loadTakes("assets/voice",g.script);Renderer renderer;renderer.init(window,g,proof);
    if(bench){renderer.benchmark(window,g,"FEVER-benchmark.csv");DestroyWindow(window);return 0;}
    if(proof){screenshotProof(window,renderer,g);renderer.benchmark(window,g,"proof/timer-smoke.csv",2,2);DestroyWindow(window);return 0;}
    ShowWindow(window,SW_SHOW);RAWINPUTDEVICE raw{1,2,0,window};RegisterRawInputDevices(&raw,1,sizeof raw);
    Output audio(mixer);Saved save;Menu menu;Pad pad;bool usingPad=false;float elapsed=0,accum=0;Input pending{};
    LARGE_INTEGER prev,freq;QueryPerformanceFrequency(&freq);QueryPerformanceCounter(&prev);
    auto show=[&](Page page){menu.page=page;menu.selected=0;keys.mouse=keys.right=false;};
    auto openRecording=[&](Recording i,Stage cp,int beat,bool remember){
        g.start(i,cp,beat);if(remember&&i!=Recording::Range){save.call=int(i);save.cp=int(cp);save.beat=beat;save.write();}
        pending={};accum=0;audio.update(g,save.prefs,true,false,true);show(Page::Playing);
    };
    auto apply=[&](Command c,int direction=1){
        switch(c){
        case Command::Start:openRecording(Recording::Animal,Stage::Flight,0,true);break;
        case Command::Archive:menu.back=Page::Title;show(Page::Archive);break;
        case Command::Animal:case Command::House:case Command::Grey:openRecording(Recording(int(c)-int(Command::Animal)),Stage::Flight,0,true);break;
        case Command::Next:openRecording(Recording(std::min(2,int(g.recording)+1)),Stage::Flight,0,true);break;
        case Command::Practice:openRecording(Recording::Range,Stage::Flight,0,false);break;
        case Command::Retry:case Command::Continue:openRecording(Recording(save.call),save.cp>=0?Stage(save.cp):Stage::Flight,save.beat,false);break;
        case Command::Resume:show(Page::Playing);break;
        case Command::Title:show(Page::Title);audio.update(g,save.prefs,false,false,true);break;
        case Command::Options:case Command::Controls:menu.back=menu.page;show(c==Command::Options?Page::Options:Page::Controls);break;
        case Command::Back:show(menu.back);break;
        case Command::Exit:quit=true;break;
        case Command::Profile:save.prefs.psx=!save.prefs.psx;break;
        case Command::Motion:save.prefs.steady=!save.prefs.steady;break;
        case Command::Lens:save.prefs.lens=!save.prefs.lens;break;
        case Command::Grain:save.prefs.grain=!save.prefs.grain;break;
        case Command::Range:save.prefs.nightMix=!save.prefs.nightMix;break;
        case Command::Look:case Command::PadLook:{float& v=c==Command::Look?save.prefs.look:save.prefs.padLook;int step=int(std::lround(v*10))-4;v=(4+(step+direction+17)%17)/10.f;break;}
        case Command::Deadzone:{int step=int(std::lround(save.prefs.deadzone*100))-4;save.prefs.deadzone=(4+(step+direction+27)%27)/100.f;break;}
        case Command::Volume:{int v=int(std::round(save.prefs.volume*10));save.prefs.volume=((v+direction+11)%11)/10.f;break;}
        default:break;}
        if(c>=Command::Profile)save.write();
        if(c!=Command::None)g.emit(Sound::Key,g.camera,Bus::Body,.7f);
    };
    bool runningPad=false;float stickRepeat=0;int lastNav=0;
    bool telemetry=false;std::array<float,120> samples{};size_t sampled=0;float sampleClock=0;

    while(!quit){
        MSG msg;while(PeekMessageW(&msg,nullptr,0,0,PM_REMOVE)){if(msg.message==WM_QUIT){quit=true;break;}TranslateMessage(&msg);DispatchMessageW(&msg);}
        if(quit)break;LARGE_INTEGER now;QueryPerformanceCounter(&now);float actual=float(double(now.QuadPart-prev.QuadPart)/freq.QuadPart);float dt=std::min(.1f,actual);prev=now;elapsed+=dt;
        RECT bounds;GetClientRect(window,&bounds);if(!bounds.right||!bounds.bottom||IsIconic(window)){if(menu.page==Page::Playing)show(Page::Pause);lockMouse(window,false);audio.update(g,save.prefs,false,true);keys.edges();Sleep(35);continue;}
        if(!keys.focused&&menu.page==Page::Playing)show(Page::Pause);pad.poll();auto& controller=pad.state.Gamepad;
        if(pad.pressed||controller.bRightTrigger>60)usingPad=true;
        if(keys.rawX||keys.rawY||keys.moved||keys.click||keys.tap[VK_RETURN])usingPad=false;
        if(keys.tap[VK_F3]){telemetry=!telemetry;menu.performance.clear();sampled=0;sampleClock=0;}
        if(telemetry&&menu.page==Page::Playing){
            samples[sampled++%samples.size()]=actual*1000;sampleClock+=actual;
            if(sampleClock>=.5f){
                auto times=samples;size_t count=std::min(sampled,times.size());std::sort(times.begin(),times.begin()+count);
                float mean=0;for(size_t i=0;i<count;i++)mean+=times[i]/float(count);
                char line[100];std::snprintf(line,sizeof line,"D3D11  %.0f FPS   %.1f MS   P95 %.1f",1000/std::max(.01f,mean),mean,times[(count*95+99)/100-1]);
                menu.performance=line;sampleClock=0;
            }
        }
        if(keys.tap[VK_F5])loadTuning("assets/shift.cfg",g.tuning);
        float aspect=float(bounds.right)/bounds.bottom;if(menu.page!=Page::Playing)menu.build(g,save.prefs,save.cp>=0,aspect,elapsed,usingPad);
        if(menu.page==Page::Playing&&keys.focused){
            if(keys.escape||(pad.pressed&XINPUT_GAMEPAD_START)){show(Page::Pause);pending={};accum=0;}
            else{
                auto l=Pad::stick(controller.sThumbLX,controller.sThumbLY,.17f),r=Pad::stick(controller.sThumbRX,controller.sThumbRY,save.prefs.deadzone);
                Input input;input.walk=clamp(float(keys.down['W']-keys.down['S'])+l.z,-1,1);input.strafe=clamp(float(keys.down['D']-keys.down['A'])+l.x,-1,1);
                input.aim=keys.right||controller.bLeftTrigger>42;
                float sensitivity=1-g.aim*(g.weapon()==Weapon::Sniper?.69f:.39f);V turn=stickTurn(r,dt,save.prefs.padLook);
                pending.dx+=(keys.rawX*.0021f*save.prefs.look+turn.x)*sensitivity;pending.dy+=(-keys.rawY*.0021f*save.prefs.look+turn.z)*sensitivity;
                if(pad.pressed&XINPUT_GAMEPAD_LEFT_THUMB)runningPad=true;if(l.z<.25f||input.aim||controller.bRightTrigger>45||!pad.live)runningPad=false;
                input.sprint=keys.down[VK_SHIFT]||runningPad;input.crouch=keys.down[VK_CONTROL]||(controller.wButtons&XINPUT_GAMEPAD_B);
                input.fire=keys.mouse||pad.trigger;pending.firePressed|=keys.click||pad.triggerPressed;pending.light|=keys.tap['F']||(pad.pressed&XINPUT_GAMEPAD_DPAD_UP);
                pending.uv|=keys.tap['V']||(pad.pressed&XINPUT_GAMEPAD_DPAD_LEFT);pending.jump|=keys.tap[VK_SPACE]||(pad.pressed&XINPUT_GAMEPAD_A);pending.interact|=keys.tap['E']||(pad.pressed&XINPUT_GAMEPAD_X);
                pending.reload|=keys.tap['R']||((pad.pressed&XINPUT_GAMEPAD_X)&&g.prompt(true).empty());
                pending.cycle+=keys.wheel>0?-1:keys.wheel<0?1:0;if(pad.pressed&XINPUT_GAMEPAD_Y)pending.cycle++;
                for(int j=0;j<(g.recording==Recording::Range?7:int(g.loadout.size()));j++)if(keys.tap['1'+j])pending.weapon=j;
                accum+=dt;constexpr float step=1.f/90;int steps=std::min(9,int(accum/step));
                if(steps){input.dx=pending.dx/steps;input.dy=pending.dy/steps;
                    for(int j=0;j<steps;j++){
                        Input frame=input;if(!j){frame.uv=pending.uv;frame.light=pending.light;frame.jump=pending.jump;frame.interact=pending.interact;frame.reload=pending.reload;frame.cycle=pending.cycle;frame.weapon=pending.weapon;frame.firePressed=pending.firePressed;frame.fire|=frame.firePressed;}
                        Stage old=g.stage;int oldBeat=g.beat;g.tick(frame,save.prefs,step);accum-=step;
                        bool checkpoint=old!=g.stage&&(g.stage==Stage::Apron||g.stage==Stage::Kennels||g.stage==Stage::Recovery||g.stage==Stage::Report);
                        bool progress=oldBeat!=g.beat&&((g.recording==Recording::House&&g.beat<=5)||(g.recording==Recording::Grey&&g.beat<=2));
                        if(g.recording!=Recording::Range&&(checkpoint||progress)){save.cp=int(g.stage);save.call=int(g.recording);save.beat=g.beat;save.write();}
                    }pending={};
                }
                if(g.stage==Stage::Lost&&g.age>.85f)show(Page::Lost);
                if(g.stage==Stage::Filed&&g.age>9&&g.subtitle.left<=0&&g.queue.empty()){save.cp=g.recording==Recording::Grey?-1:int(Stage::Flight);save.call=std::min(2,int(g.recording)+1);save.beat=0;save.write();show(Page::Filed);}
            }
        }else if(keys.focused){
            V sticks=Pad::stick(controller.sThumbLX,controller.sThumbLY,.34f);
            int nav=keys.tap[VK_DOWN]||(pad.pressed&XINPUT_GAMEPAD_DPAD_DOWN)?1:keys.tap[VK_UP]||(pad.pressed&XINPUT_GAMEPAD_DPAD_UP)?-1:0;
            int held=sticks.z<-.46f?1:sticks.z>.46f?-1:0;stickRepeat-=dt;if(held&&(held!=lastNav||stickRepeat<=0)){nav=held;stickRepeat=held==lastNav?.16f:.36f;}lastNav=held;
            if(nav){menu.navigate(nav);g.emit(Sound::Key,g.camera,Bus::Body,.55f);}
            int under=menu.hit(keys.mouseX/float(bounds.right)*menu.width,keys.mouseY/float(bounds.bottom)*720);
            if(under>=0&&(keys.moved||keys.click))menu.selected=under;
            bool left=keys.tap[VK_LEFT]||(pad.pressed&XINPUT_GAMEPAD_DPAD_LEFT),rightKey=keys.tap[VK_RIGHT]||(pad.pressed&XINPUT_GAMEPAD_DPAD_RIGHT);
            if(keys.escape||(pad.pressed&XINPUT_GAMEPAD_B)){if(menu.page==Page::Options||menu.page==Page::Controls||menu.page==Page::Archive)apply(Command::Back);else if(menu.page==Page::Pause)apply(Command::Resume);}
            else if(keys.tap[VK_RETURN]||(keys.click&&under>=0)||(pad.pressed&XINPUT_GAMEPAD_A))apply(menu.confirm());
            else if((left||rightKey)&&menu.page==Page::Options&&menu.confirm()>=Command::Profile)apply(menu.confirm(),left?-1:1);
        }
        bool play=menu.page==Page::Playing;lockMouse(window,play&&keys.focused);
        bool pausedMenu=menu.page==Page::Pause||((menu.page==Page::Options||menu.page==Page::Controls)&&menu.back==Page::Pause);
        audio.update(g,save.prefs,play,pausedMenu);
        menu.build(g,save.prefs,save.cp>=0,aspect,elapsed,usingPad);renderer.draw(window,g,save.prefs,menu,dt);renderer.present();keys.edges();
    }
    lockMouse(window,false);DestroyWindow(window);return 0;
}
}
int WINAPI WinMain(HINSTANCE h,HINSTANCE,LPSTR args,int){
    try{return run(h,args?args:"");}catch(const std::exception& e){
        std::ofstream("FEVER-error.txt")<<e.what()<<"\n";
        if(!args||std::string(args).find("--verify")==std::string::npos)MessageBoxA(nullptr,e.what(),"FEVER - startup",MB_OK|MB_ICONERROR);return 1;}
}
