export default function AuthAside({ title, text }) {
  return (
    <aside className="auth-aside">
      <h2>{title}</h2>
      <p>{text}</p>
      <ul className="auth-points">
        <li>
          <span className="dot">&#10003;</span>
          Your private PIN approves every withdrawal and transfer
        </li>
        <li>
          <span className="dot">&#10003;</span>
          Five wrong passwords lock the account for 15 minutes
        </li>
        <li>
          <span className="dot">&#10003;</span>
          Sessions end automatically after 30 minutes
        </li>
      </ul>
    </aside>
  );
}
// end of file
