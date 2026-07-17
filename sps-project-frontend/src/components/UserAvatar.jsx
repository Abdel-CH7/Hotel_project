const initialsFor = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const UserAvatar = ({ user, size = 38, className = "" }) => (
  <span
    className={`app-user-avatar ${className}`.trim()}
    style={{ width: size, height: size }}
    aria-hidden="true"
  >
    {user?.photo_url ? (
      <img src={user.photo_url} alt="" />
    ) : initialsFor(user?.name)}
  </span>
);

export default UserAvatar;
