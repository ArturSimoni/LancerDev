import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';

const API_URL = 'http://localhost:3000';

const freelancerLinks = [
  { to: '/dashboard', label: 'Painel' },
  { to: '/projetos', label: 'Buscar projetos' },
  { to: '/propostas', label: 'Minhas propostas' },
];

const clientLinks = [
  { to: '/dashboard', label: 'Painel' },
  { to: '/criar-projeto', label: 'Publicar vaga' },
  { to: '/meus-anuncios', label: 'Meus anúncios' },
];

const NOTIFICATION_META = {
  message: { icon: '✉', color: '#33b5e5' },
  review: { icon: '★', color: '#ffb400' },
  payment: { icon: '$', color: '#00c851' },
  completion: { icon: '✓', color: '#00c851' },
  other: { icon: '•', color: '#ff8a36' },
};

function getAuthState() {
  const userData = localStorage.getItem('@LancerDev:user');
  let user = null;

  try {
    user = userData ? JSON.parse(userData) : null;
  } catch {
    user = null;
  }

  return {
    auth: !!localStorage.getItem('@LancerDev:token'),
    role: localStorage.getItem('@LancerDev:role'),
    user,
  };
}

function classifyNotification(notification) {
  const type = String(notification.type || '').toLowerCase();
  const message = String(notification.message || '').toLowerCase();

  const isMessage =
    type.includes('message') ||
    type.includes('chat') ||
    message.includes('enviou uma mensagem') ||
    message.includes('nova mensagem');

  if (isMessage) return 'message';

  const isReview =
    type.includes('review') ||
    type.includes('rating') ||
    type.includes('avaliacao') ||
    type.includes('avaliação') ||
    message.includes('nova avaliação') ||
    message.includes('pode avaliar') ||
    message.includes('avaliar o freelancer');

  if (isReview) return 'review';

  const isCompletion =
    type.includes('complete') ||
    type.includes('concluido') ||
    type.includes('concluído') ||
    message.includes('foi concluído') ||
    message.includes('foi concluido') ||
    message.includes('projeto concluído') ||
    message.includes('projeto concluido');

  if (isCompletion) return 'completion';

  const isPayment =
    type.includes('payment') ||
    type.includes('pagamento') ||
    message.includes('pagamento');

  if (isPayment) return 'payment';

  return 'other';
}

function BellIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 01-3.4 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function LogoMark() {
  return (
    <span style={s.logoMark} aria-hidden="true">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 7l-5 5 5 5" />
        <path d="M15 7l5 5-5 5" />
      </svg>
    </span>
  );
}

function NavItem({ to, label, active }) {
  return (
    <Link
      to={to}
      className={`ld-link${active ? ' active' : ''}`}
      style={active ? s.linkActive : s.link}
      aria-current={active ? 'page' : undefined}
    >
      {label}
      {active && <span style={s.activeBar} />}
    </Link>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState(getAuthState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('@LancerDev:token');

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setNotificationsLoading(true);

      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível carregar as notificações.');
      }

      const data = await response.json();

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      setState(getAuthState());
      fetchNotifications();
    };

    window.addEventListener('authChange', sync);

    return () => window.removeEventListener('authChange', sync);
  }, [fetchNotifications]);

  useEffect(() => {
    setMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!state.auth) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    const interval = window.setInterval(fetchNotifications, 30000);

    return () => window.clearInterval(interval);
  }, [state.auth, fetchNotifications]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!notificationsOpen && !menuOpen) return undefined;

    const onPointerDown = (event) => {
      if (!event.target.closest('[data-ld-notif-root]')) {
        setNotificationsOpen(false);
      }

      if (!event.target.closest('[data-ld-header]')) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [notificationsOpen, menuOpen]);

  async function markNotificationAsRead(id) {
    const token = localStorage.getItem('@LancerDev:token');

    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível marcar a notificação como lida.');
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount((current) => Math.max(0, current - 1));

      return true;
    } catch (error) {
      console.error('Erro ao atualizar notificação:', error);
      return false;
    }
  }

  async function markAllNotificationsAsRead() {
    const token = localStorage.getItem('@LancerDev:token');

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Não foi possível marcar as notificações como lidas.');
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    }
  }

  async function handleNotificationClick(notification) {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    setNotificationsOpen(false);
    setMenuOpen(false);

    const projectId = notification.projectId
      ? Number(notification.projectId)
      : null;

    const kind = classifyNotification(notification);

    if (kind === 'message') {
      navigate(projectId ? `/chat?projectId=${projectId}` : '/chat');
      return;
    }

    if (kind === 'review') {
      navigate(projectId ? `/projeto/${projectId}` : '/dashboard');
      return;
    }

    if (kind === 'payment' || kind === 'completion') {
      navigate(
        projectId ? `/dashboard?projectId=${projectId}` : '/dashboard'
      );
      return;
    }

    if (projectId) {
      navigate(`/projeto/${projectId}`);
      return;
    }

    navigate('/dashboard');
  }

  function handleLogout() {
    localStorage.removeItem('@LancerDev:token');
    localStorage.removeItem('@LancerDev:role');
    localStorage.removeItem('@LancerDev:user');

    window.dispatchEvent(new Event('authChange'));

    setState(getAuthState());
    setNotifications([]);
    setUnreadCount(0);
    setMenuOpen(false);
    setNotificationsOpen(false);

    navigate('/');
  }

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);

    if (!notificationsOpen) fetchNotifications();
  }

  const links =
    state.role === 'freelancer'
      ? freelancerLinks
      : state.role === 'client'
        ? clientLinks
        : [];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const profilePath = state.user?.id ? `/perfil/${state.user.id}` : '/perfil';
  const firstName = state.user?.name?.trim().split(' ')[0] || 'Minha conta';
  const avatarLetter = state.user?.name?.trim().charAt(0).toUpperCase() || 'U';

  const roleLabel =
    state.role === 'freelancer'
      ? 'Freelancer'
      : state.role === 'client'
        ? 'Cliente'
        : '';

  const roleColor = state.role === 'freelancer' ? '#00c851' : '#33b5e5';

  function formatNotificationDate(date) {
    if (!date) return '';

    const notificationDate = new Date(date);

    if (Number.isNaN(notificationDate.getTime())) return '';

    return notificationDate.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderNotificationsPanel(inline = false) {
    return (
      <div
        className="ld-panel"
        style={inline ? { ...s.notificationPanel, ...s.notificationPanelInline } : s.notificationPanel}
      >
        <div style={s.notificationHeader}>
          <div>
            <strong style={s.notificationTitle}>Notificações</strong>
            <span style={s.notificationSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Tudo em dia'}
            </span>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="ld-text-btn"
              style={s.markAllButton}
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        <div style={s.notificationList}>
          {notificationsLoading && notifications.length === 0 ? (
            <div style={s.notificationEmpty}>Carregando notificações...</div>
          ) : notifications.length === 0 ? (
            <div style={s.notificationEmpty}>
              <span style={s.emptyBell}>
                <BellIcon />
              </span>
              <strong style={s.emptyTitle}>Nenhuma notificação</strong>
              <span>Quando houver novidades, elas aparecerão aqui.</span>
            </div>
          ) : (
            notifications.map((notification) => {
              const meta =
                NOTIFICATION_META[classifyNotification(notification)];

              return (
                <button
                  type="button"
                  key={notification.id}
                  className="ld-notif-item"
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    ...s.notificationItem,
                    ...(notification.read ? {} : s.notificationUnread),
                  }}
                >
                  <span
                    style={{
                      ...s.notificationIcon,
                      color: meta.color,
                      background: `${meta.color}1a`,
                      borderColor: `${meta.color}40`,
                    }}
                  >
                    {meta.icon}
                  </span>

                  <span style={s.notificationContent}>
                    <span
                      style={{
                        ...s.notificationMessage,
                        color: notification.read ? '#a8a8a8' : '#ececec',
                      }}
                    >
                      {notification.message}
                    </span>
                    <span style={s.notificationDate}>
                      {formatNotificationDate(notification.createdAt)}
                    </span>
                  </span>

                  {!notification.read && <span style={s.unreadDot} />}
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="ld-footer-btn"
          style={s.refreshButton}
          onClick={fetchNotifications}
        >
          Atualizar notificações
        </button>
      </div>
    );
  }

  return (
    <header
      data-ld-header
      className="ld-header"
      style={{
        ...s.header,
        ...(scrolled ? s.headerScrolled : {}),
      }}
    >
      <div className="ld-container" style={s.container}>
        <Link to="/" style={s.logo} aria-label="LancerDev - Início">
          <LogoMark />
          <span style={s.logoText}>
            Lancer<span style={s.logoAccent}>Dev</span>
          </span>
        </Link>

        <nav className="ld-nav" style={s.nav} aria-label="Navegação principal">
          <NavItem to="/" label="Início" active={isActive('/')} />

          {state.auth &&
            links.map(({ to, label }) => (
              <NavItem key={to} to={to} label={label} active={isActive(to)} />
            ))}
        </nav>

        <div className="ld-auth" style={s.authArea}>
          {state.auth ? (
            <div style={s.userMenu}>
              <div data-ld-notif-root style={s.notificationWrapper}>
                <button
                  type="button"
                  onClick={toggleNotifications}
                  className="ld-icon-btn"
                  style={{
                    ...s.notificationButton,
                    ...(notificationsOpen ? s.notificationButtonOpen : {}),
                  }}
                  aria-label="Abrir notificações"
                  aria-expanded={notificationsOpen}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="ld-badge" style={s.notificationBadge}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && renderNotificationsPanel()}
              </div>

              <Link to={profilePath} className="ld-profile" style={s.profileLink}>
                <div style={s.avatar}>{avatarLetter}</div>

                <span style={s.profileText}>
                  <span style={s.usernameLink}>{firstName}</span>
                  {roleLabel && (
                    <span style={{ ...s.roleLabel, color: roleColor }}>
                      {roleLabel}
                    </span>
                  )}
                </span>
              </Link>

              <span style={s.divider} />

              <button
                type="button"
                onClick={handleLogout}
                className="ld-logout"
                style={s.logoutBtn}
              >
                <LogoutIcon />
                Sair
              </button>
            </div>
          ) : (
            <div style={s.authButtons}>
              <Link to="/login" className="ld-login" style={s.loginBtn}>
                Entrar
              </Link>

              <Link to="/cadastro" className="ld-register" style={s.registerBtn}>
                Criar conta
                <span style={s.registerArrow}>→</span>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className="ld-hamburger"
          style={s.hamburger}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          <span
            style={{
              ...s.bar,
              transform: menuOpen
                ? 'translateY(7px) rotate(45deg)'
                : 'none',
            }}
          />
          <span style={{ ...s.bar, opacity: menuOpen ? 0 : 1 }} />
          <span
            style={{
              ...s.bar,
              transform: menuOpen
                ? 'translateY(-7px) rotate(-45deg)'
                : 'none',
            }}
          />
          {state.auth && unreadCount > 0 && !menuOpen && (
            <span style={s.hamburgerDot} />
          )}
        </button>
      </div>

      <span style={s.glowLine} aria-hidden="true" />

      {menuOpen && (
        <div className="ld-mobile" style={s.mobileMenu}>
          <div style={s.mobileNavGroup}>
            <Link
              to="/"
              className="ld-mobile-link"
              style={isActive('/') ? s.mobileLinkActive : s.mobileLink}
            >
              <span>Início</span>
              {isActive('/') && <span style={s.activeIndicator} />}
            </Link>

            {state.auth &&
              links.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="ld-mobile-link"
                  style={isActive(to) ? s.mobileLinkActive : s.mobileLink}
                >
                  <span>{label}</span>
                  {isActive(to) && <span style={s.activeIndicator} />}
                </Link>
              ))}
          </div>

          <div style={s.mobileDivider} />

          {state.auth ? (
            <>
              <div data-ld-notif-root>
                <button
                  type="button"
                  className="ld-mobile-link"
                  style={s.mobileNotificationButton}
                  onClick={toggleNotifications}
                >
                  <span style={s.mobileNotificationLabel}>
                    <BellIcon />
                    Notificações
                  </span>

                  {unreadCount > 0 && (
                    <span style={s.mobileNotificationBadge}>{unreadCount}</span>
                  )}
                </button>

                {notificationsOpen && renderNotificationsPanel(true)}
              </div>

              <Link to={profilePath} className="ld-mobile-link" style={s.mobileProfile}>
                <div style={s.avatar}>{avatarLetter}</div>

                <div style={s.mobileProfileInfo}>
                  <strong>{firstName}</strong>
                  <span style={{ color: roleColor, fontSize: '11px' }}>
                    {roleLabel || 'Meu perfil'}
                  </span>
                </div>

                <span style={s.mobileProfileArrow}>→</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="ld-mobile-logout"
                style={s.mobileLogout}
              >
                <span style={s.mobileNotificationLabel}>
                  <LogoutIcon />
                  Sair da conta
                </span>
              </button>
            </>
          ) : (
            <div style={s.mobileAuthButtons}>
              <Link to="/login" style={s.mobileLoginBtn}>
                Entrar
              </Link>

              <Link to="/cadastro" style={s.mobileRegisterBtn}>
                Criar conta
                <span>→</span>
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        .ld-link:hover:not(.active) {
          color: #ffffff !important;
          background: #151515 !important;
        }

        .ld-icon-btn:hover {
          color: #ffffff !important;
          background: #1c1c1c !important;
          border-color: #3a3a3a !important;
        }

        .ld-profile:hover {
          background: #171717 !important;
          border-color: #2c2c2c !important;
        }

        .ld-logout:hover {
          color: #ff8a36 !important;
        }

        .ld-login:hover {
          color: #ffffff !important;
        }

        .ld-register:hover {
          background: #ff7d1f !important;
          box-shadow: 0 8px 22px rgba(255, 107, 0, 0.3) !important;
          transform: translateY(-1px);
        }

        .ld-notif-item:hover {
          background: #171717 !important;
        }

        .ld-text-btn:hover {
          color: #ffb070 !important;
        }

        .ld-footer-btn:hover {
          color: #ffffff !important;
          background: #1a1a1a !important;
        }

        .ld-mobile-link:hover {
          background: #151515 !important;
        }

        .ld-mobile-logout:hover {
          background: rgba(255, 107, 0, 0.1) !important;
        }

        .ld-header a:focus-visible,
        .ld-header button:focus-visible {
          outline: 2px solid #ff6b00;
          outline-offset: 2px;
        }

        .ld-panel {
          animation: ld-pop 0.16s ease-out;
        }

        .ld-badge {
          animation: ld-pulse 2.2s infinite;
        }

        @keyframes ld-pop {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: none;
          }
        }

        @keyframes ld-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 107, 0, 0.5);
          }
          70% {
            box-shadow: 0 0 0 7px rgba(255, 107, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 107, 0, 0);
          }
        }

        @media (max-width: 850px) {
          .ld-nav,
          .ld-auth {
            display: none !important;
          }

          .ld-hamburger {
            display: flex !important;
          }
        }

        @media (min-width: 851px) {
          .ld-mobile {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          .ld-container {
            padding: 0 16px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ld-header *,
          .ld-header *::before,
          .ld-header *::after {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </header>
  );
}

const s = {
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    background: 'rgba(10, 10, 10, 0.82)',
    borderBottom: '1px solid #1c1c1c',
    backdropFilter: 'blur(16px) saturate(140%)',
    WebkitBackdropFilter: 'blur(16px) saturate(140%)',
    transition: 'background 0.25s, box-shadow 0.25s',
  },
  headerScrolled: {
    background: 'rgba(10, 10, 10, 0.95)',
    boxShadow: '0 10px 34px rgba(0, 0, 0, 0.35)',
  },
  glowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '-1px',
    height: '1px',
    background:
      'linear-gradient(90deg, transparent 0%, rgba(255, 107, 0, 0.45) 50%, transparent 100%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: '1280px',
    height: '70px',
    margin: '0 auto',
    padding: '0 28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '28px',
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    textDecoration: 'none',
  },
  logoMark: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #ff9a42, #ff6b00)',
    boxShadow: '0 6px 18px rgba(255, 107, 0, 0.28)',
  },
  logoText: {
    color: '#fff',
    fontSize: '21px',
    fontWeight: '800',
    letterSpacing: '-0.9px',
  },
  logoAccent: {
    color: '#ff6b00',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    flex: 1,
  },
  link: {
    position: 'relative',
    padding: '9px 14px',
    border: '1px solid transparent',
    borderRadius: '9px',
    color: '#8f8f8f',
    fontSize: '13px',
    fontWeight: '550',
    textDecoration: 'none',
    transition: 'color 0.2s, background 0.2s',
  },
  linkActive: {
    position: 'relative',
    padding: '9px 14px',
    border: '1px solid #262626',
    borderRadius: '9px',
    background: '#171717',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '650',
    textDecoration: 'none',
  },
  activeBar: {
    position: 'absolute',
    left: '50%',
    bottom: '-17px',
    width: '22px',
    height: '2px',
    transform: 'translateX(-50%)',
    borderRadius: '2px',
    background: '#ff6b00',
    boxShadow: '0 0 10px rgba(255, 107, 0, 0.7)',
  },
  authArea: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  loginBtn: {
    padding: '9px 12px',
    color: '#b5b5b5',
    fontSize: '13px',
    fontWeight: '600',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  registerBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    padding: '10px 17px',
    borderRadius: '9px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '13px',
    fontWeight: '750',
    textDecoration: 'none',
    transition: 'background 0.2s, transform 0.2s, box-shadow 0.2s',
  },
  registerArrow: {
    fontSize: '16px',
    lineHeight: 1,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '4px 13px 4px 4px',
    border: '1px solid transparent',
    borderRadius: '12px',
    color: '#ddd',
    textDecoration: 'none',
    transition: 'background 0.2s, border-color 0.2s',
  },
  avatar: {
    width: '34px',
    height: '34px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #ff9a42, #ff6b00)',
    color: '#111',
    fontSize: '14px',
    fontWeight: '800',
    boxShadow: '0 4px 14px rgba(255, 107, 0, 0.2)',
  },
  profileText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  usernameLink: {
    maxWidth: '120px',
    overflow: 'hidden',
    color: '#e6e6e6',
    fontSize: '13px',
    fontWeight: '650',
    lineHeight: 1.1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  roleLabel: {
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.4px',
    textTransform: 'uppercase',
    lineHeight: 1.1,
  },
  divider: {
    width: '1px',
    height: '22px',
    background: '#2a2a2a',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 2px',
    border: 'none',
    background: 'transparent',
    color: '#858585',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  notificationWrapper: {
    position: 'relative',
  },
  notificationButton: {
    position: 'relative',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #262626',
    borderRadius: '10px',
    background: '#141414',
    color: '#bdbdbd',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
  },
  notificationButtonOpen: {
    background: '#1c1c1c',
    borderColor: '#ff6b0066',
    color: '#ff8a36',
  },
  notificationBadge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    minWidth: '18px',
    height: '18px',
    padding: '0 4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #0a0a0a',
    borderRadius: '20px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '10px',
    fontWeight: '800',
  },
  notificationPanel: {
    position: 'absolute',
    top: '50px',
    right: 0,
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    overflow: 'hidden',
    border: '1px solid #2a2a2a',
    borderRadius: '14px',
    background: '#101010',
    boxShadow: '0 20px 55px rgba(0, 0, 0, 0.55)',
    zIndex: 1100,
  },
  notificationPanelInline: {
    position: 'static',
    width: '100%',
    maxWidth: '100%',
    margin: '6px 0 10px',
    boxShadow: 'none',
  },
  notificationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #232323',
  },
  notificationTitle: {
    display: 'block',
    color: '#fff',
    fontSize: '14px',
  },
  notificationSubtitle: {
    display: 'block',
    marginTop: '4px',
    color: '#858585',
    fontSize: '11px',
  },
  markAllButton: {
    border: 'none',
    background: 'transparent',
    color: '#ff8a36',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  notificationList: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  notificationEmpty: {
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '22px',
    color: '#808080',
    fontSize: '12px',
    textAlign: 'center',
  },
  emptyBell: {
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    background: '#ff6b0014',
    color: '#ff8a36',
  },
  emptyTitle: {
    color: '#ddd',
    fontSize: '13px',
  },
  notificationItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px 16px',
    border: 'none',
    borderBottom: '1px solid #1d1d1d',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  notificationUnread: {
    background: 'rgba(255, 107, 0, 0.05)',
  },
  notificationIcon: {
    width: '30px',
    height: '30px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid',
    borderRadius: '9px',
    fontSize: '13px',
    fontWeight: '800',
  },
  notificationContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '5px',
    minWidth: 0,
  },
  notificationMessage: {
    fontSize: '12px',
    lineHeight: 1.5,
  },
  notificationDate: {
    color: '#707070',
    fontSize: '10px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    flexShrink: 0,
    marginTop: '6px',
    borderRadius: '50%',
    background: '#ff6b00',
    boxShadow: '0 0 8px rgba(255, 107, 0, 0.7)',
  },
  refreshButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderTop: '1px solid #232323',
    background: '#141414',
    color: '#9a9a9a',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'background 0.2s, color 0.2s',
  },
  hamburger: {
    position: 'relative',
    display: 'none',
    width: '40px',
    height: '40px',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    border: '1px solid #262626',
    borderRadius: '10px',
    background: '#141414',
    cursor: 'pointer',
  },
  hamburgerDot: {
    position: 'absolute',
    top: '-3px',
    right: '-3px',
    width: '10px',
    height: '10px',
    border: '2px solid #0a0a0a',
    borderRadius: '50%',
    background: '#ff6b00',
  },
  bar: {
    width: '18px',
    height: '2px',
    display: 'block',
    borderRadius: '2px',
    background: '#fff',
    transition: 'transform 0.2s, opacity 0.2s',
  },
  mobileMenu: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px 20px 20px',
    background: '#0c0c0c',
    borderTop: '1px solid #1f1f1f',
    maxHeight: 'calc(100vh - 70px)',
    overflowY: 'auto',
  },
  mobileNavGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  mobileLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 12px',
    borderRadius: '10px',
    color: '#aaa',
    fontSize: '14px',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  mobileLinkActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 12px',
    borderRadius: '10px',
    background: 'rgba(255, 107, 0, 0.09)',
    color: '#ff8a36',
    fontSize: '14px',
    fontWeight: '650',
    textDecoration: 'none',
  },
  activeIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ff6b00',
    boxShadow: '0 0 8px rgba(255, 107, 0, 0.7)',
  },
  mobileDivider: {
    height: '1px',
    margin: '12px 0',
    background: '#222',
  },
  mobileNotificationButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '13px 12px',
    border: 'none',
    borderRadius: '10px',
    background: 'transparent',
    color: '#ddd',
    fontSize: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mobileNotificationLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
  },
  mobileNotificationBadge: {
    minWidth: '20px',
    height: '20px',
    padding: '0 5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '11px',
    fontWeight: '800',
  },
  mobileProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    padding: '10px 12px',
    borderRadius: '10px',
    color: '#fff',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  mobileProfileInfo: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '3px',
    fontSize: '13px',
  },
  mobileProfileArrow: {
    color: '#777',
    fontSize: '18px',
  },
  mobileLogout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '8px',
    padding: '13px 12px',
    border: '1px solid #2b2220',
    borderRadius: '10px',
    background: 'rgba(255, 107, 0, 0.05)',
    color: '#ff8a36',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  mobileAuthButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  mobileLoginBtn: {
    padding: '12px',
    border: '1px solid #303030',
    borderRadius: '10px',
    color: '#ddd',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'center',
    textDecoration: 'none',
  },
  mobileRegisterBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    padding: '12px',
    borderRadius: '10px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '14px',
    fontWeight: '750',
    textDecoration: 'none',
  },
};