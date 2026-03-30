export default function ContactsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 md:px-6">
      <section className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Контакты</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-slate-950">
          Адрес, график, связи и форма для клиента
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Контактная страница уже готова под MVP: клиент видит режим работы,
          телефон и быстрые точки контакта.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="grid gap-5 text-sm text-slate-700">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Адрес</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                Калининград, Московский проспект, 184
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Телефон</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                +7 (4012) 99-45-45
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Email</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                service@avtoslot.ru
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Режим работы</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                Пн-Пт: 09:00 - 19:00
              </p>
              <p className="mt-1 text-base font-semibold text-slate-950">
                Сб: 10:00 - 16:00
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Карта</p>
            <div className="mt-6 grid min-h-[280px] place-items-center rounded-[28px] bg-[linear-gradient(135deg,_#dbeafe_0%,_#f8fafc_55%,_#fee2e2_100%)]">
              <p className="max-w-sm text-center text-sm text-slate-600">
                В MVP здесь расположен блок карты. На проде его можно заменить на
                Яндекс Карты или Google Maps iframe без изменения верстки.
              </p>
            </div>
          </div>
          <div className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">
              Обратная связь
            </p>
            <form className="mt-6 grid gap-3">
              <input
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Ваше имя"
              />
              <input
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Телефон или email"
              />
              <textarea
                rows={5}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-sky-300"
                placeholder="Сообщение"
              />
              <button
                type="button"
                className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
              >
                Отправить
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
