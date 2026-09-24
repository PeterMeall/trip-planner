import { Icon, Fab } from '../components/ui.jsx';
import { REMINDER_CATS, dShort, nameOf } from '../lib/util.js';
import { updateRow } from '../lib/data.js';
import { t } from '../lib/i18n.js';

export default function Reminders({ ctx }) {
  const { trip, reminders, items, now, open, remKey, nowKey } = ctx;
  const rows = reminders.map((r) => {
    const overdue = !r.done && r.date && remKey(r) < nowKey;
    const today = !r.done && !overdue && r.date === now.date;
    return { ...r, overdue, today };
  }).sort((a, b) => remKey(a).localeCompare(remKey(b)));

  const groups = [
    { title: t('Overdue'), rows: rows.filter((r) => r.overdue), danger: true },
    { title: t('Today'), rows: rows.filter((r) => r.today) },
    { title: t('Coming up'), rows: rows.filter((r) => !r.done && !r.overdue && !r.today) },
    { title: t('Done'), rows: rows.filter((r) => r.done) }
  ].filter((g) => g.rows.length);
  const open2 = rows.filter((r) => !r.done).length;

  return (
    <>
      <main className="screen">
        {ctx.listHead}
        <div className="stack">
          <span className="sub">{t('{a} to do · {b} done', { a: open2, b: rows.length - open2 })}</span>
        </div>
        {!rows.length && (
          <div className="empty">{t('Things you mustn\u2019t forget: bookings to cancel, balances to pay, online check-ins. Tap + to add one, or use "Add reminder" on any booking.')}</div>
        )}
        {groups.map((g) => (
          <section key={g.title} className="section">
            <h2 className="eyebrow" style={g.danger ? { color: 'var(--danger)' } : undefined}>{g.title}</h2>
            <div className="card list">
              {g.rows.map((r) => {
                const c = REMINDER_CATS[r.cat] || REMINDER_CATS.other;
                const linked = r.itemId ? items.find((it) => it.id === r.itemId) : null;
                const when = !r.date ? t('No date') : (r.date === now.date ? t('Today') + ' ' + (r.time || '') : dShort(r.date) + (r.time ? ' · ' + r.time : ''));
                const meta = [r.who === 'both' || !r.who ? t('For both of you') : t('For {name}', { name: nameOf(trip, r.who) })];
                if (linked) meta.push(t('Linked to {name}', { name: linked.title }));
                if (r.note) meta.push(r.note);
                return (
                  <div key={r.id} className="row" style={{ alignItems: 'flex-start', gap: 4, padding: '6px 6px 12px 4px' }}>
                    <button className="iconbtn clear" aria-pressed={!!r.done} aria-label={(r.done ? t('Mark not done: {name}', { name: r.title }) : t('Mark done: {name}', { name: r.title }))}
                      onClick={() => updateRow(trip.id, 'reminders', r.id, { done: !r.done })}>
                      <span className={'check' + (r.done ? ' done' : '') + (r.overdue ? ' late' : '')}>
                        {r.done && <Icon d="check" size={14} stroke={3} color="#FFFBF5" />}
                      </span>
                    </button>
                    <button className="stack grow" style={{ border: 0, background: 'none', padding: '8px 8px 0 0', textAlign: 'left', gap: 4 }}
                      onClick={() => open({ kind: 'remForm', reminder: r })} aria-label={t('Edit reminder: {name}', { name: r.title })}>
                      <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
                        <span className="small" style={{ fontWeight: 600, color: r.overdue ? 'var(--danger)' : r.today ? '#8A420C' : 'var(--muted)' }}>
                          {r.overdue ? t('Overdue') + ' · ' : ''}{when}
                        </span>
                      </span>
                      <span className={'row-title' + (r.done ? ' strike' : '')}>{r.title}</span>
                      <span className="small muted">{meta.join(' · ')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
      <Fab label={t('Add a reminder')} onClick={() => open({ kind: 'remForm' })} />
    </>
  );
}
