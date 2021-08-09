import Image from 'next/image';
import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent}>
        <Link href="/">
          <a>
            <Image
              width={238.62}
              height={25.63}
              src="/images/logo.svg"
              alt="logo"
            />
          </a>
        </Link>
      </div>
    </header>
  );
}
