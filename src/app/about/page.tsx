export default function AboutPage() {
  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
        <p className="eyebrow text-sm uppercase tracking-[0.24em]">О сервисе</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-[var(--color-ink)]">
          Заботимся об автомобиле аккуратно, прозрачно и точно по времени
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
          Мы сделали сервис, в котором удобно записаться онлайн, быстро выбрать
          нужные работы и приехать к назначенному времени без лишних звонков и
          путаницы.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Опытные специалисты",
            text: "Работаем с техническим обслуживанием, диагностикой, тормозной системой и ходовой частью.",
          },
          {
            title: "Понятный сервис",
            text: "До визита вы видите стоимость и длительность работ, а после обслуживания история сохраняется в кабинете.",
          },
          {
            title: "Удобная запись",
            text: "Свободное время отображается сразу, а подтверждение записи приходит без лишней переписки и ожидания.",
          },
        ].map((item) => (
          <div key={item.title} className="surface-card rounded-[32px] p-8">
            <h2 className="font-[family:var(--font-display)] text-3xl text-[var(--color-ink)]">
              {item.title}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
