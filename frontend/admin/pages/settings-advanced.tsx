import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { useToast } from "../hooks/useToast"
import { Store, Globe, Truck, CreditCard, Mail, Palette } from "lucide-react"

export default function AdminSettingsPageAdvanced() {
  const { toast } = useToast()
  const [storeName, setStoreName] = useState("Loja Mãe")
  const [storeEmail, setStoreEmail] = useState("contato@lojama.com")
  const [storePhone, setStorePhone] = useState("+351 969 407 406")
  const [storeDescription, setStoreDescription] = useState("")

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações foram atualizadas com sucesso!",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">Gerencie as configurações da sua loja</p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="store">Loja</TabsTrigger>
          <TabsTrigger value="domains">Domínios</TabsTrigger>
          <TabsTrigger value="shipping">Frete</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="emails">E-mails</TabsTrigger>
          <TabsTrigger value="appearance">Aparência</TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                Dados da Loja
              </CardTitle>
              <CardDescription>Informações básicas da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nome da Loja</Label>
                <Input
                  id="store-name"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nome da sua loja"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-email">Email</Label>
                <Input
                  id="store-email"
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="contato@lojama.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-phone">Telefone</Label>
                <Input
                  id="store-phone"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+351 969 407 406"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-description">Descrição</Label>
                <Textarea
                  id="store-description"
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Descrição da sua loja"
                  rows={4}
                />
              </div>

              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domains" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Domínios
              </CardTitle>
              <CardDescription>Configure os domínios da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-domain">Domínio Principal</Label>
                <Input id="primary-domain" placeholder="www.lojama.com" />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Frete
              </CardTitle>
              <CardDescription>Configure as opções de frete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Configurações de frete serão implementadas aqui</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pagamentos
              </CardTitle>
              <CardDescription>Configure os métodos de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
                <Input id="stripe-key" type="password" placeholder="pk_live_..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                <Input id="stripe-secret" type="password" placeholder="sk_live_..." />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emails" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                E-mails
              </CardTitle>
              <CardDescription>Configure os endereços de e-mail</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-from">E-mail de Envio</Label>
                <Input id="email-from" type="email" placeholder="noreply@lojama.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-support">E-mail de Suporte</Label>
                <Input id="email-support" type="email" placeholder="suporte@lojama.com" />
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Aparência
              </CardTitle>
              <CardDescription>Personalize a aparência da sua loja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Cor Primária</Label>
                <Input id="primary-color" type="color" defaultValue="#000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-family">Fonte</Label>
                <Select defaultValue="inter">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="open-sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave}>Salvar</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

