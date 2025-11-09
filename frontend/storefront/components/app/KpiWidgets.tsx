export default function KpiWidgets() {
  const widgets = [
    { title: 'Novos Produtos', value: '32', delta: '+12%' },
    { title: 'Em Promoção', value: '18', delta: '+5%' },
    { title: 'Itens em Stock', value: '1.298', delta: '-2%' },
    { title: 'Pedidos Hoje', value: '24', delta: '+3%' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {widgets.map((w) => (
        <div key={w.title} className="card p-4">
          <p className="text-xs text-muted-foreground">{w.title}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xl font-semibold text-primary">{w.value}</p>
            <span className="badge">{w.delta}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

