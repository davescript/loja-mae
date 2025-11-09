import { Wrench, Truck, BadgeCheck, Palette } from 'lucide-react';

const services = [
  { icon: Palette, title: 'Design Consultation', desc: 'Curadoria estética e orientação de interiores.' },
  { icon: Truck, title: 'Entrega Premium', desc: 'Envio seguro e rápido com proteção.' },
  { icon: Wrench, title: 'Montagem & Instalação', desc: 'Equipe especializada para montagem.' },
  { icon: BadgeCheck, title: 'Garantia Estendida', desc: 'Cobertura ampliada e suporte dedicado.' },
];

export default function ServicesSection() {
  return (
    <section className="bg-secondary/60 py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <h2 className="text-3xl md:text-4xl font-heading mb-10">Speciality Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl bg-card p-6 shadow-soft">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="mt-4 font-medium">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

