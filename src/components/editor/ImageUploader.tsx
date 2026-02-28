import { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ImageUploader = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ name: string; url: string }[]>([]);
  const { user } = useAuth();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('user-uploads').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from('user-uploads').getPublicUrl(path);
    setUploadedImages(prev => [...prev, { name: file.name, url: publicUrl }]);
    toast.success('Image uploaded');
    setUploading(false);
  };

  return (
    <div className="space-y-3">
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()} disabled={uploading}>
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Upload Image'}
      </Button>

      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Uploaded Images</p>
          {uploadedImages.map((img, i) => (
            <div key={i} className="flex items-center gap-2 border border-border rounded-md p-2 text-xs">
              <ImageIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{img.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
