"""Bake the shared wall and street sign atlas. No runtime font dependency."""
from pathlib import Path
import os
from PIL import Image, ImageDraw, ImageFont

rows = [
    ("PORT MERCER", "ANIMAL CONTROL", "18 LAKE STREET   /   AFTER-HOURS INTAKE"),
    ("ADMISSIONS", "KENNEL INTAKE", "COUNTY ANIMAL SERVICES"),
    ("NO ANALGESIA", "TRIAL CONTINUES", "HUMANE STOP ORDER 103   /   OVERRIDE INITIALLED"),
    ("WITHDRAWAL DENIED", "KEEP SUBJECT AWAKE", "MOTOR RESPONSE AFTER CERTIFIED DEATH"),
    ("ISOLATION", "OCCUPIED", "OBSERVATION WING   /   AUTHORISED STAFF"),
    ("REAR ACCESS", "LAKE STREET", "SERVICE EXIT   /   KEEP CLEAR"),
    ("EXPOSURE LOG", "18:34  NO PULSE", "18:52   RESPONSE TO KNOCKING"),
    ("POLICE", "NIGHT SHIFT", "MUTUAL AID   /   RECORDS"),
    ("MAIN AT LAKE", "MERCER HARDWARE", "KEYS CUT   /   TOOL REPAIR"),
    ("ESTABLISHED 1953", "LAKE DRUG", "COUNTY PHARMACY"),
    ("CITY TRANSIT", "LAKE STREET", "ROUTE 04   /   NORTHBOUND"),
    ("MERCER", "GROCER & DELI", "ENTRANCE ON LAKE"),
    ("UPPER FLAT", "ROOMS TO LET", "PORT MERCER, MICHIGAN"),
    ("TRANSPORT", "DEPOT", "RECEIVING   /   REAR"),
    ("CYPRESS PARISH", "118 ALDER LANE", "RURAL ROUTE TWO"),
    ("MOUNTAIN OPERATIONS", "CABIN FOUR", "MAINTENANCE RADIO INSIDE"),
    ("LIFT MAINTENANCE", "NORTH SPUR", "REPEATER ACCESS TRAIL"),
    ("STATION 06", "RADIO RELAY", "FORESTRY / MOUNTAIN OPERATIONS"),
    ("COUNTY TRAINING", "ISSUE BENCH", "SELECT EQUIPMENT"),
    ("EMERGENCY SUPPLY", "SIGNAL FLARE", "SHELTER SIX")]
atlas=Image.new("RGB",(1024,1280)); ink=ImageDraw.Draw(atlas)
def font(size, bold=False):
    win=Path(os.environ.get("WINDIR","C:/Windows"))/"Fonts"
    for name in [win/("arialbd.ttf" if bold else "consola.ttf"),
                 Path("/usr/share/fonts/truetype/dejavu")/("DejaVuSans-Bold.ttf" if bold else "DejaVuSansMono.ttf")]:
        if name.is_file(): return ImageFont.truetype(str(name),size)
    return ImageFont.load_default(size=size)
for i,(top,main,foot) in enumerate(rows):
    x=i%2*512;y=i//2*128
    ink.rectangle((x,y,x+511,y+127),fill="#bfc1ad");ink.rectangle((x+6,y+6,x+506,y+121),outline="#424843",width=2)
    ink.rectangle((x+9,y+9,x+502,y+35),fill="#69342f" if i in (2,3,4,19) else "#314a46")
    for dy,txt,sz,bold,col in [(11,top,17,False,"#eee5cc"),(38,main,42,True,"#252b26"),(99,foot,13,False,"#3e4239")]:
        f=font(sz,bold)
        while ink.textlength(txt,font=f)>465 and sz>12: sz-=1;f=font(sz,bold)
        ink.text((x+20,y+dy),txt,font=f,fill=col,anchor="lt")
    for dx in (13,499):
        for dy in (13,116): ink.ellipse((x+dx-2,y+dy-2,x+dx+2,y+dy+2),fill="#55564c")
atlas.save("assets/plaques.jpg",quality=94)
