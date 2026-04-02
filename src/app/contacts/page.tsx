import { ContactForm } from "@/components/contact-form";

export default function ContactsPage() {
  return (
    <div className="page-shell">
      <section className="page-hero max-w-4xl">
        <p className="eyebrow text-sm uppercase tracking-[0.24em]">Контакты</p>
        <h1 className="mt-4 font-[family:var(--font-display)] text-5xl text-[var(--color-ink)]">
          Приезжайте в удобное время или свяжитесь с нами любым удобным способом
        </h1>
        <p className="mt-4 text-lg leading-8 text-[var(--color-muted)]">
          На этой странице вы найдете адрес, телефон, режим работы и форму для
          быстрого обращения в сервис.
        </p>
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="surface-card rounded-[36px] p-8">
          <div className="grid gap-5 text-sm text-[var(--color-muted)]">
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.22em]">Адрес</p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                Калининград, Московский проспект, 184
              </p>
            </div>
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.22em]">Телефон</p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                +7 (4012) 99-45-45
              </p>
            </div>
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.22em]">Email</p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                service@avtoslot.ru
              </p>
            </div>
            <div>
              <p className="eyebrow text-xs uppercase tracking-[0.22em]">
                Режим работы
              </p>
              <p className="mt-2 text-base font-semibold text-[var(--color-ink)]">
                Пн-Пт: 09:00 - 19:00
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--color-ink)]">
                Сб: 10:00 - 16:00
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="surface-card rounded-[36px] p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="eyebrow text-sm uppercase tracking-[0.22em]">
                Схема проезда
              </p>
              <a
                href="https://yandex.ru/maps/-/CPbumX8S"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--color-accent-strong)] underline"
              >
                Открыть в Яндекс Картах
              </a>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[rgba(255,250,244,0.85)]">
              <iframe
                title="Карта проезда к AvtoSlot"
                src="https://api-maps.yandex.ru/frame/v1/-/CPbumX8S?lang=ru_RU"
                width="100%"
                height="320"
                loading="lazy"
                allowFullScreen
                className="block border-0"
              />
            </div>

            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              Точка на карте уже выставлена по адресу сервиса. Перед визитом можно
              построить маршрут прямо в Яндекс Картах.
            </p>
          </div>

          <div className="surface-card rounded-[36px] p-8">
            <p className="eyebrow text-sm uppercase tracking-[0.22em]">
              Обратная связь
            </p>
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
