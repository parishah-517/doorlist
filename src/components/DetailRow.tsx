import type { ReactNode } from "react";
import styles from "./DetailRow.module.css";

interface Props {
  icon: ReactNode;
  primary: ReactNode;
  secondary?: ReactNode;
  href?: string;
}

export function DetailRow({ icon, primary, secondary, href }: Props) {
  return (
    <div className={styles.row}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>
        <span className={styles.primary}>{primary}</span>
        {secondary && (
          href
            ? <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">{secondary}</a>
            : <span className={styles.secondary}>{secondary}</span>
        )}
      </div>
    </div>
  );
}
