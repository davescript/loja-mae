import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Ticket, Megaphone, Image as ImageIcon, TrendingUp, Users, Target, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"

export default function AdminMarketingPage() {
  const marketingCards = [
    {
      title: "Cupons",
      description: "Gerencie cupons de desconto e promoções",
      icon: Ticket,
      href: "/admin/coupons",
      color: "from-purple-500 to-pink-500",
      stats: "12 ativos",
    },
    {
      title: "Campanhas",
      description: "Crie e gerencie campanhas de marketing",
      icon: Megaphone,
      href: "/admin/campaigns",
      color: "from-orange-500 to-red-500",
      stats: "5 ativas",
    },
    {
      title: "Banners",
      description: "Configure banners promocionais",
      icon: ImageIcon,
      href: "/admin/banners",
      color: "from-blue-500 to-cyan-500",
      stats: "8 ativos",
    },
  ]

  const quickStats = [
    { label: "Taxa de Conversão", value: "3.2%", change: "+0.5%", trend: "up" },
    { label: "Cupons Usados", value: "1,234", change: "+12%", trend: "up" },
    { label: "Impressões", value: "45.6K", change: "+8%", trend: "up" },
    { label: "Cliques", value: "2.3K", change: "+15%", trend: "up" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-2">Gerencie todas as suas estratégias de marketing</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs mt-1 ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {stat.change} desde o mês passado
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Marketing Tools */}
      <div className="grid gap-6 md:grid-cols-3">
        {marketingCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={card.href}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{card.stats}</span>
                      <Button variant="ghost" size="sm">
                        Gerenciar →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Últimas ações de marketing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Ticket className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Novo cupom criado: DESCONTO10</div>
                <div className="text-sm text-muted-foreground">Há 2 horas</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Campanha "Promoção de Verão" iniciada</div>
                <div className="text-sm text-muted-foreground">Há 5 horas</div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium">Banner atualizado: Hero Home</div>
                <div className="text-sm text-muted-foreground">Ontem</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

