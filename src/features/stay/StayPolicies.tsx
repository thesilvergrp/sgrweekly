import { useState } from 'react';
import { Icon, type IconName } from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import type { PolicyRule, PolicyTone, StayPolicies as Policies } from '../../types/domain';
import { cx } from '../../lib/cx';
import styles from './StayPolicies.module.css';

const TONE_ICON: Record<PolicyTone, IconName> = {
  allowed: 'circleCheck',
  'not-allowed': 'circleCross',
  capacity: 'users',
  timing: 'clock',
};

const TONE_CLASS: Record<PolicyTone, string> = {
  allowed: styles.allowed,
  'not-allowed': styles.notAllowed,
  capacity: styles.capacity,
  timing: styles.timing,
};

function Rule({ rule }: { rule: PolicyRule }) {
  return (
    <li className={styles.rule}>
      <span className={cx(TONE_CLASS[rule.tone])}>
        <Icon name={TONE_ICON[rule.tone]} size={16} />
      </span>
      <span>{rule.label}</span>
    </li>
  );
}

/** Policy facts as a table, with the complete house rules behind a dialog. */
export function StayPoliciesPanel({ policies }: { policies: Policies }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DataTable caption="Good to know">
        <tr>
          <th scope="row">Check in</th>
          <td>From {policies.checkInFrom}</td>
        </tr>
        <tr>
          <th scope="row">Check out</th>
          <td>By {policies.checkOutBy}</td>
        </tr>
        <tr>
          <th scope="row">Minimum stay</th>
          <td>Seven nights, booked in whole weeks</td>
        </tr>
        <tr>
          <th scope="row">Cancellation</th>
          <td>{policies.cancellation}</td>
        </tr>
      </DataTable>

      <ul className={styles.rules}>
        {policies.headline.map((rule) => (
          <Rule key={rule.label} rule={rule} />
        ))}
      </ul>

      <Button className={styles.more} variant="link" onClick={() => setOpen(true)}>
        Read all house rules
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="House rules" size="sm">
        <div className={styles.groups}>
          {policies.houseRules.map((group) => (
            <section key={group.title}>
              <h3 className={styles.groupTitle}>{group.title}</h3>
              <ul className={styles.rules} style={{ marginTop: 0 }}>
                {group.rules.map((rule) => (
                  <Rule key={rule.label} rule={rule} />
                ))}
              </ul>
            </section>
          ))}
          <section>
            <h3 className={styles.groupTitle}>Safety</h3>
            <ul className={styles.rules} style={{ marginTop: 0 }}>
              {policies.safety.map((item) => (
                <Rule key={item} rule={{ label: item, tone: 'capacity' }} />
              ))}
            </ul>
          </section>
        </div>
      </Modal>
    </>
  );
}
