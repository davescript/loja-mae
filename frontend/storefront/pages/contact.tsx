export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading">Contactos</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed max-w-lg">
            Fale com a nossa equipa para consultas de design, pedidos especiais ou suporte. Valorizamos um atendimento calmo, eficiente e personalizado.
          </p>
          <div className="mt-8 space-y-3 text-sm">
            <p><span className="font-medium">Email:</span> contacto@loja-mae.com</p>
            <p><span className="font-medium">Telefone:</span> +351 910 000 000</p>
            <p><span className="font-medium">Horário:</span> Seg–Sex, 9h–18h</p>
          </div>
        </div>
        <form className="rounded-[var(--radius)] bg-secondary p-6 md:p-8 shadow-soft">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="px-4 py-3 rounded-xl border bg-white" placeholder="Nome" />
            <input className="px-4 py-3 rounded-xl border bg-white" placeholder="Email" type="email" />
          </div>
          <input className="mt-4 w-full px-4 py-3 rounded-xl border bg-white" placeholder="Assunto" />
          <textarea className="mt-4 w-full px-4 py-3 rounded-xl border bg-white" placeholder="Mensagem" rows={5} />
          <button className="mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground shadow-soft hover:shadow-elevated transition">
            Enviar Mensagem
          </button>
        </form>
      </div>
    </div>
  );
}

