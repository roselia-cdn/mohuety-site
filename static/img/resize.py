from PIL import Image
import os
def resize(name):
    #name=name.replace(u'\xa0',u' ')
    im = Image.open(name)
    w, h = im.size
    #print('Original image size: %sx%s' % (w, h))
    print('Archiving:',name.replace(u'\xa0',u' '),end='...')
    im.thumbnail((w//2, h//2))
    #print('Resize image to: %sx%s' % (w//2, h//2))
    im.save(name, 'jpeg')
    print('OK')

def resizedir(path):
    print("Now to "+path)
    for i in os.listdir(os.path.abspath(path)):
        #print("Now to "+i)
        if os.path.isdir(os.path.join(path,i)):
            resizedir(os.path.join(path,i))
        elif i.split('.')[-1].upper() in ['JPG','JPEG']:
            resize(os.path.join(path,i))

def main():
    while(1):
        dirnam=input('Input dir name:')
        if dirnam[0] in ('"', "'"):
            dirnam = eval(dirnam)
        if not os.path.isdir(dirnam):
            print('It is not an vaild path.')
        else:break
    resizedir(dirnam)
    #for i in os.listdir(os.path.abspath(dirnam)):
        #if i.split('.')[1]=='JPG':
        #    resize(os.path.join(dirnam,i))

if __name__=='__main__':main()
