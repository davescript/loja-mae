export default function StatsSection() {
  const stats = [
    { value: '21k+', label: 'Projetos Concluídos' },
    { value: '31+', label: 'Prémios' },
    { value: '60+', label: 'Membros da Equipa' },
    { value: '10+', label: 'Anos de Experiência' },
  ];
  return (
    <section className="container mx-auto px-4 md:px-8 py-16 md:py-24">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-secondary p-8 text-center shadow-soft">
            <p className="text-3xl md:text-4xl font-heading text-primary">{s.value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

