import { Icon, Fab } from '../components/ui.jsx';
import { REMINDER_CATS, dShort, nameOf } from '../lib/util.js';
import { updateRow } from '../lib/data.js';

export default function Reminders({ ctx }) {
  const { trip, reminders, items, now, open, remKey, nowKey } = ctx;
  const rows = reminders.map((r) => {
    const overdue = !r.done && r.date && remKey(r) < nowKey;
    const today = !r.done && !overdue && r.date === now.date;
    return { ...r, overdue, today };
  }).sort((a, b) => remKey(a).localeCompare(remKey(b)));

  const groups = [
    { title: 'Overdue', rows: rows.filter((r) => r.overdue), danger: true },
    { title: 'Today', rows: rows.filter((r) => r.today) },
    { title: 'Coming up', rows: rows.filter((r) => !r.done && !r.overdue && !r.today) },
    { title: 'Done', rows: rows.filter((r) => r.done) }
  ].filter((g) => g.rows.length);
  const open2 = rows.filter((r) => !r.done).length;

  return (
    <>
      <main className="screen">
        <div className="stack">
          <h1 className="h1">Reminders</h1>
          <span className="sub">{open2} to do · {rows.length - open2} done</span>
        </div>
        {!rows.length && (
          <div className="empty">Things you mustn't forget: bookings to cancel, balances to pay, online check-ins. Tap + to add one, or use "Add reminder" on any booking.</div>
        )}
        {groups.map((g) => (
          <section key={g.title} className="section">
            <h2 className="eyebrow" style={g.danger ? { color: 'var(--danger)' } : undefined}>{g.title}</h2>
            <div className="card list">
              {g.rows.map((r) => {
                const c = REMINDER_CATS[r.cat] || REMINDER_CATS.other;
                const linked = r.itemId ? items.find((it) => it.id === r.itemId) : null;
                const when = !r.date ? 'No date' : (r.date === now.date ? 'Today ' + (r.time || '') : dShort(r.date) + (r.time ? ' · ' + r.time : ''));
                const meta = [r.who === 'both' || !r.who ? 'For both of you' : 'For ' + nameOf(trip, r.who)];
                if (linked) meta.push('Linked to ' + linked.title);
                if (r.note) meta.push(r.note);
                return (
                  <div key={r.id} className="row" style={{ alignItems: 'flex-start', gap: 4, padding: '6px 6px 12px 4px' }}>
                    <button className="iconbtn clear" aria-pressed={!!r.done} aria-label={(r.done ? 'Mark not done: ' : 'Mark done: ') + r.title}
                      onClick={() => updateRow(trip.id, 'reminders', r.id, { done: !r.done })}>
                      <span className={'check' + (r.done ? ' done' : '') + (r.overdue ? ' late' : '')}>
                        {r.done && <Icon d="check" size={14} stroke={3} color="#FFFBF5" />}
                      </span>
                    </button>
                    <button className="stack grow" style={{ border: 0, background: 'none', padding: '8px 8px 0 0', textAlign: 'left', gap: 4 }}
                      onClick={() => open({ kind: 'remForm', reminder: r })} aria-label={'Edit reminder: ' + r.title}>
                      <span className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                        <span className="tag" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
                        <span className="small" style={{ fontWeight: 600, color: r.overdue ? 'var(--danger)' : r.today ? '#8A420C' : 'var(--muted)' }}>
                          {r.overdue ? 'Overdue · ' : ''}{when}
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
      <Fab label="Add a reminder" onClick={() => open({ kind: 'remForm' })} />
    </>
  );
}
