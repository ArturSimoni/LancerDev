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

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [state, setState] = useState(getAuthState);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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

    const type = String(notification.type || '').toLowerCase();
    const message = String(notification.message || '').toLowerCase();

    const isMessageNotification =
      type.includes('message') ||
      type.includes('chat') ||
      message.includes('enviou uma mensagem') ||
      message.includes('nova mensagem');

    const isReviewNotification =
      type.includes('review') ||
      type.includes('rating') ||
      type.includes('avaliacao') ||
      type.includes('avaliação') ||
      message.includes('nova avaliação') ||
      message.includes('pode avaliar') ||
      message.includes('avaliar o freelancer');

    const isPaymentOrCompletionNotification =
      type.includes('payment') ||
      type.includes('pagamento') ||
      type.includes('complete') ||
      type.includes('concluido') ||
      type.includes('concluído') ||
      message.includes('pagamento') ||
      message.includes('foi concluído') ||
      message.includes('foi concluido') ||
      message.includes('projeto concluído') ||
      message.includes('projeto concluido');

    if (isMessageNotification) {
      navigate(
        projectId
          ? `/chat?projectId=${projectId}`
          : '/chat'
      );
      return;
    }

    if (isReviewNotification) {
      navigate(
        projectId
          ? `/projeto/${projectId}`
          : '/dashboard'
      );
      return;
    }

    if (isPaymentOrCompletionNotification) {
      navigate(
        projectId
          ? `/dashboard?projectId=${projectId}`
          : '/dashboard'
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

  function renderNotificationsPanel() {
    return (
      <div style={s.notificationPanel}>
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
              <span style={s.emptyBell}>🔔</span>
              <strong>Nenhuma notificação</strong>
              <span>Quando houver novidades, elas aparecerão aqui.</span>
            </div>
          ) : (
            notifications.map((notification) => (
              <button
                type="button"
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  ...s.notificationItem,
                  ...(notification.read ? {} : s.notificationUnread),
                }}
              >
                <span
                  style={{
                    ...s.notificationDot,
                    background: notification.read ? 'transparent' : '#ff6b00',
                  }}
                />

                <span style={s.notificationContent}>
                  <span style={s.notificationMessage}>
                    {notification.message}
                  </span>
                  <span style={s.notificationDate}>
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </span>

                {!notification.read && (
                  <span style={s.unreadLabel}>Nova</span>
                )}
              </button>
            ))
          )}
        </div>

        <button
          type="button"
          style={s.refreshButton}
          onClick={fetchNotifications}
        >
          Atualizar notificações
        </button>
      </div>
    );
  }

  return (
    <header style={s.header}>
      <div style={s.container}>
        <Link to="/" style={s.logo} aria-label="LancerDev - Início">
          Lancer<span style={s.logoAccent}>Dev</span>
          <span style={s.logoDot} />
        </Link>

        <nav style={s.nav} aria-label="Navegação principal">
          <Link to="/" style={isActive('/') ? s.linkActive : s.link}>
            Início
          </Link>

          {state.auth &&
            links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={isActive(to) ? s.linkActive : s.link}
              >
                {label}
              </Link>
            ))}
        </nav>

        <div style={s.authArea}>
          {state.auth ? (
            <div style={s.userMenu}>
              <div style={s.notificationWrapper}>
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((open) => !open);
                    if (!notificationsOpen) fetchNotifications();
                  }}
                  style={s.notificationButton}
                  aria-label="Abrir notificações"
                  aria-expanded={notificationsOpen}
                >
                  <span style={s.bellIcon}>🔔</span>
                  {unreadCount > 0 && (
                    <span style={s.notificationBadge}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && renderNotificationsPanel()}
              </div>

              <Link to={profilePath} style={s.profileLink}>
                <div style={s.avatar}>{avatarLetter}</div>
                <span style={s.usernameLink}>{firstName}</span>
              </Link>

              <span style={s.divider} />

              <button
                type="button"
                onClick={handleLogout}
                style={s.logoutBtn}
              >
                Sair
                <span style={s.logoutIcon}>↗</span>
              </button>
            </div>
          ) : (
            <div style={s.authButtons}>
              <Link to="/login" style={s.loginBtn}>
                Entrar
              </Link>

              <Link to="/cadastro" style={s.registerBtn}>
                Criar conta
                <span style={s.registerArrow}>→</span>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          style={s.hamburger}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          <span
            style={{
              ...s.bar,
              transform: menuOpen
                ? 'rotate(45deg) translate(4px, 4px)'
                : 'none',
            }}
          />
          <span style={{ ...s.bar, opacity: menuOpen ? 0 : 1 }} />
          <span
            style={{
              ...s.bar,
              transform: menuOpen
                ? 'rotate(-45deg) translate(4px, -4px)'
                : 'none',
            }}
          />
        </button>
      </div>

      {menuOpen && (
        <div style={s.mobileMenu}>
          <div style={s.mobileNavGroup}>
            <Link
              to="/"
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
              <button
                type="button"
                style={s.mobileNotificationButton}
                onClick={() => {
                  setNotificationsOpen((open) => !open);
                  if (!notificationsOpen) fetchNotifications();
                }}
              >
                <span>🔔 Notificações</span>
                {unreadCount > 0 && (
                  <span style={s.mobileNotificationBadge}>{unreadCount}</span>
                )}
              </button>

              {notificationsOpen && renderNotificationsPanel()}

              <Link to={profilePath} style={s.mobileProfile}>
                <div style={s.avatar}>{avatarLetter}</div>
                <div style={s.mobileProfileInfo}>
                  <strong>{firstName}</strong>
                  <span>Meu perfil</span>
                </div>
                <span style={s.mobileProfileArrow}>→</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                style={s.mobileLogout}
              >
                <span>Sair da conta</span>
                <span>↗</span>
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
        .lancer-navbar-link:hover {
          color: #ffffff !important;
          background: #191919 !important;
        }

        .lancer-navbar-login:hover {
          color: #ff8a36 !important;
        }

        .lancer-navbar-register:hover {
          background: #e05e00 !important;
          transform: translateY(-1px);
        }

        .lancer-navbar-logout:hover {
          color: #ff6b00 !important;
        }

        @media (max-width: 850px) {
          .lancer-navbar-nav,
          .lancer-navbar-auth {
            display: none !important;
          }

          .lancer-navbar-hamburger {
            display: flex !important;
          }
        }

        @media (min-width: 851px) {
          .lancer-navbar-mobile {
            display: none !important;
          }
        }

        @media (max-width: 420px) {
          .lancer-navbar-container {
            padding: 0 16px !important;
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
    background: 'rgba(10, 10, 10, 0.96)',
    borderBottom: '1px solid #222',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
    backdropFilter: 'blur(14px)',
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
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    color: '#fff',
    fontSize: '23px',
    fontWeight: '850',
    letterSpacing: '-1.2px',
    textDecoration: 'none',
  },
  logoAccent: {
    color: '#ff6b00',
  },
  logoDot: {
    width: '5px',
    height: '5px',
    marginLeft: '3px',
    marginTop: '17px',
    borderRadius: '50%',
    background: '#ff6b00',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    flex: 1,
  },
  link: {
    padding: '9px 13px',
    borderRadius: '8px',
    color: '#929292',
    fontSize: '13px',
    fontWeight: '550',
    textDecoration: 'none',
    transition: 'color 0.2s, background 0.2s',
  },
  linkActive: {
    padding: '9px 13px',
    borderRadius: '8px',
    color: '#fff',
    background: '#1b1b1b',
    border: '1px solid #292929',
    fontSize: '13px',
    fontWeight: '650',
    textDecoration: 'none',
  },
  authArea: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '13px',
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
    padding: '10px 16px',
    borderRadius: '8px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '13px',
    fontWeight: '750',
    textDecoration: 'none',
    transition: 'background 0.2s, transform 0.2s',
  },
  registerArrow: {
    fontSize: '17px',
    lineHeight: 1,
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  profileLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    color: '#ddd',
    textDecoration: 'none',
  },
  avatar: {
    width: '34px',
    height: '34px',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '11px',
    background: 'linear-gradient(135deg, #ff8a36, #ff6b00)',
    color: '#111',
    fontSize: '14px',
    fontWeight: '800',
    boxShadow: '0 4px 14px rgba(255, 107, 0, 0.18)',
  },
  usernameLink: {
    maxWidth: '125px',
    overflow: 'hidden',
    color: '#d0d0d0',
    fontSize: '13px',
    fontWeight: '600',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  divider: {
    width: '1px',
    height: '22px',
    background: '#303030',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 0',
    border: 'none',
    background: 'transparent',
    color: '#858585',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  logoutIcon: {
    fontSize: '16px',
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
    border: '1px solid #292929',
    borderRadius: '10px',
    background: '#151515',
    color: '#ddd',
    cursor: 'pointer',
  },
  bellIcon: {
    fontSize: '18px',
    lineHeight: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
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
    top: '48px',
    right: 0,
    width: '360px',
    maxWidth: 'calc(100vw - 32px)',
    overflow: 'hidden',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    background: '#111',
    boxShadow: '0 16px 45px rgba(0, 0, 0, 0.45)',
    zIndex: 1100,
  },
  notificationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #292929',
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
  },
  notificationList: {
    maxHeight: '340px',
    overflowY: 'auto',
  },
  notificationEmpty: {
    minHeight: '130px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '20px',
    color: '#888',
    fontSize: '12px',
    textAlign: 'center',
  },
  emptyBell: {
    color: '#ff8a36',
    fontSize: '24px',
  },
  notificationItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '14px 15px',
    border: 'none',
    borderBottom: '1px solid #222',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
  },
  notificationUnread: {
    background: 'rgba(255, 107, 0, 0.06)',
  },
  notificationDot: {
    width: '7px',
    height: '7px',
    flexShrink: 0,
    marginTop: '5px',
    borderRadius: '50%',
  },
  notificationContent: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: '6px',
  },
  notificationMessage: {
    color: '#e5e5e5',
    fontSize: '12px',
    lineHeight: 1.5,
  },
  notificationDate: {
    color: '#777',
    fontSize: '10px',
  },
  unreadLabel: {
    color: '#ff8a36',
    fontSize: '10px',
    fontWeight: '700',
  },
  refreshButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderTop: '1px solid #292929',
    background: '#151515',
    color: '#aaa',
    fontSize: '11px',
    cursor: 'pointer',
  },
  hamburger: {
    display: 'none',
    width: '40px',
    height: '40px',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    border: '1px solid #292929',
    borderRadius: '9px',
    background: '#151515',
    cursor: 'pointer',
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
    background: '#0d0d0d',
    borderTop: '1px solid #222',
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
    borderRadius: '8px',
    color: '#aaa',
    fontSize: '14px',
    textDecoration: 'none',
  },
  mobileLinkActive: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '13px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 107, 0, 0.08)',
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
  },
  mobileDivider: {
    height: '1px',
    margin: '12px 0',
    background: '#242424',
  },
  mobileNotificationButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '13px 12px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: '#ddd',
    fontSize: '14px',
    textAlign: 'left',
    cursor: 'pointer',
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
    padding: '10px 8px',
    color: '#fff',
    textDecoration: 'none',
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
    borderRadius: '8px',
    background: 'rgba(255, 107, 0, 0.05)',
    color: '#ff8a36',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'left',
    cursor: 'pointer',
  },
  mobileAuthButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '9px',
  },
  mobileLoginBtn: {
    padding: '12px',
    border: '1px solid #303030',
    borderRadius: '8px',
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
    borderRadius: '8px',
    background: '#ff6b00',
    color: '#111',
    fontSize: '14px',
    fontWeight: '750',
    textDecoration: 'none',
  },
};