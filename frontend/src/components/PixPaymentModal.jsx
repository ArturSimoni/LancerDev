import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import api from '../services/api';

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

export default function PixPaymentModal({
  projectId,
  milestoneId,
  onClose,
  onPaid
}) {
  const [phase, setPhase] = useState('loading');
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!startedRef.current) {
      startedRef.current = true;

      api
        .post('/payments/criar', {
          projectId: Number(projectId),
          milestoneId: Number(milestoneId)
        })
        .then(response => {
          if (!mountedRef.current) {
            return;
          }

          setPayment(response.data);

          if (response.data?.status === 'paid') {
            setPhase('paid');
            onPaid?.();
          } else {
            setPhase('waiting');
          }
        })
        .catch(err => {
          if (!mountedRef.current) {
            return;
          }

          console.error('Erro ao gerar pagamento Pix:', err);

          setError(
            err.response?.data?.message ||
            'Não foi possível gerar o pagamento Pix.'
          );

          setPhase('error');
        });
    }

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== 'waiting' || !payment?.paymentId) {
      return undefined;
    }

    const timer = setInterval(async () => {
      try {
        const response = await api.get(
          `/payments/${payment.paymentId}/status`
        );

        if (!mountedRef.current) {
          return;
        }

        const status = response.data?.status;

        if (status === 'paid') {
          setPhase('paid');
          onPaid?.();
        } else if (status === 'rejected' || status === 'cancelled') {
          setError(
            'O pagamento Pix não foi concluído. Feche esta janela e gere um novo código.'
          );

          setPhase('error');
        }
      } catch (err) {
        console.error('Erro ao consultar pagamento:', err);
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [phase, payment?.paymentId]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(payment.pix.qrCode);

      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Não foi possível copiar. Selecione o código manualmente.');
    }
  }

  const qrCode = payment?.pix?.qrCode || '';
  const qrCodeBase64 = payment?.pix?.qrCodeBase64 || '';

  return (
    <div style={s.overlay}>
      <div style={s.modal}>
        <button
          type="button"
          onClick={onClose}
          style={s.close}
        >
          ×
        </button>

        <h2 style={s.title}>
          Pagamento via Pix
        </h2>

        {phase === 'loading' && (
          <p style={s.text}>
            Gerando código Pix...
          </p>
        )}

        {phase === 'error' && (
          <>
            <div style={s.errorBox}>
              {error}
            </div>

            <button
              type="button"
              onClick={onClose}
              style={s.secondaryButton}
            >
              Fechar
            </button>
          </>
        )}

        {phase === 'waiting' && payment && (
          <>
            <p style={s.amount}>
              {formatCurrency(payment.amount)}
            </p>

            <p style={s.text}>
              Escaneie o QR Code ou use o Pix copia e cola no app do seu banco.
            </p>

            <div style={s.qrBox}>
              {qrCodeBase64 ? (
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code Pix"
                  style={s.qrImage}
                />
              ) : qrCode ? (
                <QRCodeSVG
                  value={qrCode}
                  size={190}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              ) : (
                <span style={s.qrEmpty}>
                  QR Code indisponível
                </span>
              )}
            </div>

            {qrCode && (
              <>
                <textarea
                  readOnly
                  value={qrCode}
                  style={s.code}
                  onFocus={event => event.target.select()}
                />

                <button
                  type="button"
                  onClick={handleCopy}
                  style={s.primaryButton}
                >
                  {copied ? 'Código copiado!' : 'Copiar código Pix'}
                </button>
              </>
            )}

            <div style={s.waiting}>
              <span style={s.dot} />
              Aguardando confirmação do pagamento...
            </div>

            <p style={s.hint}>
              Esta janela atualiza sozinha quando o pagamento for confirmado.
            </p>
          </>
        )}

        {phase === 'paid' && (
          <>
            <div style={s.successIcon}>✓</div>

            <h3 style={s.successTitle}>
              Pagamento confirmado
            </h3>

            <p style={s.text}>
              O valor foi recebido e o repasse ao freelancer foi registrado.
            </p>

            <button
              type="button"
              onClick={onClose}
              style={s.primaryButton}
            >
              Concluir
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    backgroundColor: '#000000cc',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },

  modal: {
    position: 'relative',
    width: '100%',
    maxWidth: '420px',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxSizing: 'border-box',
    backgroundColor: '#171717',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '28px',
    textAlign: 'center',
    color: '#fff'
  },

  close: {
    position: 'absolute',
    top: '12px',
    right: '15px',
    border: 'none',
    background: 'transparent',
    color: '#888',
    fontSize: '28px',
    cursor: 'pointer'
  },

  title: {
    margin: '0 0 14px',
    fontSize: '20px',
    color: '#fff'
  },

  amount: {
    margin: '0 0 8px',
    color: '#00c851',
    fontSize: '26px',
    fontWeight: '700'
  },

  text: {
    margin: '0 0 16px',
    color: '#aaa',
    fontSize: '13px',
    lineHeight: '1.6'
  },

  qrBox: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '210px',
    minHeight: '210px',
    padding: '10px',
    marginBottom: '16px',
    backgroundColor: '#fff',
    borderRadius: '8px'
  },

  qrImage: {
    width: '190px',
    height: '190px'
  },

  qrEmpty: {
    color: '#555',
    fontSize: '12px'
  },

  code: {
    width: '100%',
    minHeight: '74px',
    boxSizing: 'border-box',
    resize: 'none',
    marginBottom: '12px',
    padding: '10px',
    backgroundColor: '#101010',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#ccc',
    fontSize: '11px',
    fontFamily: 'monospace'
  },

  primaryButton: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ff6b00',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  },

  secondaryButton: {
    width: '100%',
    padding: '12px',
    border: '1px solid #333',
    borderRadius: '6px',
    backgroundColor: '#1a1a1a',
    color: '#ccc',
    fontWeight: '600',
    cursor: 'pointer'
  },

  waiting: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
    color: '#f5a623',
    fontSize: '12px',
    fontWeight: '600'
  },

  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f5a623'
  },

  hint: {
    margin: '8px 0 0',
    color: '#666',
    fontSize: '11px'
  },

  errorBox: {
    marginBottom: '16px',
    padding: '12px',
    color: '#ff9999',
    backgroundColor: '#381919',
    border: '1px solid #733333',
    borderRadius: '6px',
    fontSize: '13px',
    lineHeight: '1.5'
  },

  successIcon: {
    width: '52px',
    height: '52px',
    margin: '6px auto 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: '#00c85122',
    border: '1px solid #00c85155',
    color: '#00c851',
    fontSize: '24px',
    fontWeight: '800'
  },

  successTitle: {
    margin: '0 0 8px',
    color: '#00c851',
    fontSize: '18px'
  }
};