import { assets } from "../figmaAssets";
import styles from "./DeleteButton.module.css";

type Props = {
  label: string;
  onClick: () => void;
};

export function DeleteButton({ label, onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.btn}
      aria-label={label}
      onClick={onClick}
    >
      <img src={assets.iconDeleteHostCircle} className={styles.circle} alt="" aria-hidden="true" />
      <img src={assets.iconDeleteHostMinus} className={styles.minus} alt="" aria-hidden="true" />
    </button>
  );
}
