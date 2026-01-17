import { useState } from 'react';
import { Settings, Server, Key, Check, X, User } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { JellyfinConfig } from '~/types/jellyfin';

interface ConfigPanelProps {
  config: JellyfinConfig | null;
  //onSave: (config: JellyfinConfig) => void;
  //onClear: () => void;
  onConnect: () => void;
}

export function ConfigPanel({ config, onConnect }: ConfigPanelProps) {
  const [isEditing, setIsEditing] = useState(!config);
  const [url, setServerUrl] = useState(config?.url || '');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [userId, setUserId] = useState(config?.userId || '');

  const handleSave = () => {
    if (serverUrl && apiKey && userId) {
      onSave({ serverUrl, apiKey, userId });
      setIsEditing(false);
      onConnect();
    }
  };

  const handleCancel = () => {
    if (config) {
      setServerUrl(config.serverUrl);
      setApiKey(config.apiKey);
      setUserId(config.userId);
      setIsEditing(false);
    }
  };

  if (!isEditing && config) {
    return (
      <div className="gradient-card rounded-lg p-4 border border-border animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Conectado</p>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {config.serverUrl}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"              
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-lg p-6 border border-border animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-primary shadow-glow">
          <Settings className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">Configuração</h2>
          <p className="text-sm text-muted-foreground">Configure seu servidor Jellyfin</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="serverUrl" className="flex items-center gap-2 text-sm">
            <Server className="w-4 h-4 text-primary" />
            URL do Servidor
          </Label>
          <Input
            id="serverUrl"
            placeholder="http://ip:porta"
            value={url}            
            className="bg-input border-border focus:border-primary focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Inclua o IP e a porta (ex: http://192.168.1.14:8096)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey" className="flex items-center gap-2 text-sm">
            <Key className="w-4 h-4 text-primary" />
            API Key
          </Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Sua chave de API do Jellyfin"
            value={apiKey}            
            className="bg-input border-border focus:border-primary focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Encontre em Dashboard → API Keys no Jellyfin
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="userId" className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" />
            User ID
          </Label>
          <Input
            id="userId"
            placeholder="ID do usuário do Jellyfin"
            value={userId}            
            className="bg-input border-border focus:border-primary focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground">
            Encontre em Dashboard → Users → clique no usuário → copie o ID da URL
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          
          
        </div>
      </div>
    </div>
  );
}
