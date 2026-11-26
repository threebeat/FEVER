"""Regenerate FEVER graphic sheets. The optional argument is the legacy surface atlas."""
from pathlib import Path
import sys, random
from PIL import Image, ImageDraw, ImageFont
assets=Path(__file__).resolve().parents[1]/'assets'
rng=random.Random(1706)
fontroot=Path('/usr/share/fonts/truetype')
def font(path,size):
    return ImageFont.truetype(str(fontroot/path),size)
mono='dejavu/DejaVuSansMono.ttf'
bold='open-sans/OpenSans-CondBold.ttf'
if len(sys.argv)>1:
    image=Image.open(sys.argv[1]).convert('RGB')
    image.resize((1024,512),Image.Resampling.LANCZOS).save(assets/'materials.jpg',quality=91)
sheet=Image.new('RGBA',(1024,512));g=ImageDraw.Draw(sheet)
for i in range(95):
    c=chr(32+i);x=(i%16)*32;y=(i//16)*40
    g.text((x+1,y+1),c,font=font(mono,26),fill='white',stroke_width=0,anchor='lt')
f=font(bold,196);logo=Image.new('RGBA',(680,195));d=ImageDraw.Draw(logo)
d.text((0,0),'FEVER',font=f,fill='#e5e2d9',anchor='lt',stroke_width=1)
logo=logo.crop(logo.getbbox()).resize((620,144),Image.Resampling.LANCZOS)
# Small missing emulsion flecks keep the tall, optically set title legible.
d=ImageDraw.Draw(logo)
for _ in range(670):
    x=rng.randrange(620);y=rng.randrange(144);d.line((x,y,x+rng.choice([0,1,2,4]),y),fill=(0,0,0,0))
sheet.alpha_composite(logo,(0,280));sheet.save(assets/'lettering.png',optimize=True)
signs=[
('06 / COUNTY RELAY','SERVICE INTAKE','NORTH BANK RESEARCH   /   COUNTY LEASE   /   1978'),
('WET HOLDING','ANIMAL STUDIES','ROOM 06    /    NONPUBLIC    /    KEEP GATES CLOSED'),
('NO ANALGESIA','TRIAL CONTINUES','HUMANE STOP ORDER 103    /    OVERRIDE INITIALLED'),
('WITHDRAWAL DENIED','KEEP SUBJECT AWAKE','MOTOR RESPONSE AFTER CERTIFIED DEATH    /    LOG 04'),
('ISOLATION','OCCUPIED','OBSERVATION WING   /   AUTHORISED STAFF'),
('EMERGENCY LINE','COUNTY DISPATCH','RELAY SET 6B   /   PRESS TO TRANSMIT'),
('EXPOSURE LOG','18:34   NO PULSE','18:52   RESPONSE TO KNOCKING    /    19:01   BITING'),
('NORTH BANK','COUNTY POLICE','NIGHT SHIFT    /    EVIDENCE DIVISION')]
labels=Image.new('RGB',(1024,512),'#bbbcae');p=ImageDraw.Draw(labels)
for i,(top,main,foot) in enumerate(signs):
    x=i%2*512;y=i//2*128
    p.rectangle((x,y,x+511,y+127),fill='#bdc2ad')
    p.rectangle((x+7,y+7,x+504,y+120),outline='#4b5149',width=2)
    p.rectangle((x+8,y+8,x+503,y+34),fill='#692c27' if i in [2,3,4] else '#2f4b47')
    p.text((x+18,y+10),top,font=font(mono,18),fill='#e6deca',anchor='lt')
    p.text((x+17,y+41),main,font=font(bold,44),fill='#232a27',anchor='lt')
    p.text((x+17,y+98),foot,font=font(mono,12),fill='#303a33',anchor='lt')
    for tx in (x+13,x+499):
        for ty in (y+13,y+115):p.ellipse((tx-2,ty-2,tx+2,ty+2),fill='#56574b')
    for _ in range(500):
        a=x+rng.randrange(512);b=y+rng.randrange(128)
        p.point((a,b),fill=rng.choice(['#8d8e76','#bbb4a2','#66695e']))
labels.save(assets/'plaques.jpg',quality=92)


# Eight tileable surface profiles. XY store normal slopes, B roughness, A local cavity.
# Details are derived separately per tile so a plaster edge never bleeds into metal.
from PIL import ImageFilter, ImageChops
tiles=Image.open(assets/'materials.jpg').convert('L')
detail=Image.new('RGBA',tiles.size)
roughness=[181,158,92,212,147,182,107,198]
for i,base in enumerate(roughness):
    x=i%4*256;y=i//4*256
    tile=tiles.crop((x,y,x+256,y+256)).filter(ImageFilter.GaussianBlur(.62))
    def gradient(dx,dy):
        before=ImageChops.offset(tile,-dx,-dy);after=ImageChops.offset(tile,dx,dy)
        return ImageChops.subtract(after,before,1.0,128)
    broad=tile.filter(ImageFilter.GaussianBlur(3))
    cavity=ImageChops.subtract(tile,broad,1.4,227)
    rough=tile.point(lambda value: max(32,min(245,base+(value-127)*.32)))
    detail.paste(Image.merge('RGBA',(gradient(1,0),gradient(0,1),rough,cavity)),(x,y))
detail.save(assets/'surface-response.png',optimize=True)
