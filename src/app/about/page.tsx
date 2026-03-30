export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">О сервисе</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Современный автосервис с прозрачной цифровой записью
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          AvtoSlot задуман как понятный и надежный сервис для русскоязычных
          клиентов: без сложных кабинетов, перегруженных интерфейсов и
          потерянных заявок.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "Опыт и доверие",
            text: "Работаем с плановым обслуживанием, диагностикой, тормозной системой и ходовой частью.",
          },
          {
            title: "Понятный клиентский путь",
            text: "От выбора услуги до отслеживания статуса заявки все собрано в одном месте и на русском языке.",
          },
          {
            title: "Готовность к росту",
            text: "Архитектура MVP позволяет добавить онлайн-оплату, SMS, CRM и мобильное приложение без переделки базы.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
          >
            <h2 className="font-[family:var(--font-display)] text-3xl text-slate-950">
              {item.title}
            </h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
