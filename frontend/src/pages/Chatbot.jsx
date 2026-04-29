import { useState, useRef, useEffect, useCallback } from 'react'
import { postConsulta } from '../api'
import PageHeader from '../components/PageHeader'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import SendRoundedIcon from '@mui/icons-material/SendRounded'
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded'
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'

const SUGERENCIAS = [
  { texto:'¿Cuántos productos están en pérdida?',          emoji:'📉' },
  { texto:'¿Cuál es la utilidad total del inventario?',    emoji:'💰' },
  { texto:'¿Cuántos laboratorios proveedores hay?',        emoji:'🏭' },
  { texto:'¿Cuál es el margen de rentabilidad general?',   emoji:'📊' },
  { texto:'¿Qué productos tienen rentabilidad excelente?', emoji:'⭐' },
  { texto:'¿Cuántos productos únicos hay en el catálogo?', emoji:'💊' },
]

const MSG_INICIAL = [{ rol:'bot', texto:'Buenos días. Soy el asistente inteligente de BUCAMLAI, impulsado por Gemini 2.5 Flash. Tengo acceso completo al inventario de Bucaclínicos S.A.S. Puedo analizar ventas, rentabilidad, tendencias por clima y mucho más. ¿En qué le puedo ayudar?' }]
const STORAGE_KEY = 'bucamlai_chat_msgs'

export default function Chatbot() {
  const [msgs, setMsgs] = useState(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_KEY)
      return guardado ? JSON.parse(guardado) : MSG_INICIAL
    } catch { return MSG_INICIAL }
  })
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Persistir en localStorage cada vez que cambian los mensajes
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs)) } catch { }
  }, [msgs])

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [msgs])

  const limpiarChat = () => {
    setMsgs(MSG_INICIAL)
    try { localStorage.removeItem(STORAGE_KEY) } catch { }
  }

  const send = async (text) => {
    const q = (text||input).trim()
    if (!q || loading) return
    setInput('')
    setMsgs(m=>[...m,{ rol:'user', texto:q }])
    setLoading(true)
    try {
      const r = await postConsulta(q)
      setMsgs(m=>[...m,{ rol:'bot', texto:r.data.respuesta||r.data.error||'Sin respuesta.' }])
    } catch {
      setMsgs(m=>[...m,{ rol:'bot', texto:'No se pudo conectar con el servicio de IA.', error:true }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <Box className="page-enter" sx={{ display:'flex', flexDirection:'column', height:'calc(100vh - 80px)' }}>
      <PageHeader badge="Gemini 2.5 Flash" title="Consultas Inteligentes"
        subtitle="Preguntas en lenguaje natural sobre el inventario de Bucaclínicos" />

      <Box sx={{ display:'grid', gridTemplateColumns:'1fr 268px', gap:2, flex:1, minHeight:0 }}>

        {/* Chat */}
        <Paper elevation={1} sx={{ borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {/* Header */}
          <Box sx={{ px:2.5, py:1.5, borderBottom:'1px solid #EDF2F7', display:'flex', alignItems:'center', gap:1.5 }}>
            <Avatar sx={{ width:34, height:34, bgcolor:'#1A202C' }}>
              <SmartToyRoundedIcon sx={{ fontSize:17, color:'#fff' }} />
            </Avatar>
            <Box sx={{ flex:1 }}>
              <Typography sx={{ fontWeight:600, fontSize:'0.875rem', color:'#1A202C' }}>Asistente BUCAMLAI</Typography>
              <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
                <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'#38A169' }} />
                <Typography sx={{ fontSize:'0.72rem', color:'#718096' }}>En línea · Gemini 2.5 Flash · {msgs.length - 1} mensajes</Typography>
              </Box>
            </Box>
            <IconButton
              size="small" onClick={limpiarChat} disabled={loading}
              title="Limpiar conversación"
              sx={{ color:'#A0AEC0', '&:hover':{ color:'#E53E3E', bgcolor:'#FFF5F5' } }}
            >
              <DeleteOutlineRoundedIcon sx={{ fontSize:18 }} />
            </IconButton>
          </Box>

          {/* Mensajes */}
          <Box sx={{ flex:1, overflowY:'auto', p:2.5, display:'flex', flexDirection:'column', gap:2, bgcolor:'#F7FAFC' }}>
            {msgs.map((m,i) => (
              <Box key={i} sx={{ display:'flex', gap:1.25, alignItems:'flex-end', flexDirection:m.rol==='user'?'row-reverse':'row' }}>
                <Avatar sx={{ width:30, height:30, flexShrink:0, bgcolor:m.rol==='bot'?'#1A202C':'#E53E3E' }}>
                  {m.rol==='bot'
                    ? <SmartToyRoundedIcon sx={{ fontSize:14, color:'#fff' }} />
                    : <PersonRoundedIcon   sx={{ fontSize:14, color:'#fff' }} />}
                </Avatar>
                <Box sx={{
                  maxWidth:'72%', px:1.75, py:1.25,
                  borderRadius: m.rol==='user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  bgcolor: m.rol==='user' ? '#E53E3E' : '#fff',
                  color:   m.rol==='user' ? '#fff'    : '#1A202C',
                  boxShadow: m.rol==='user'
                    ? '0 2px 8px rgba(229,62,62,0.25)'
                    : '0 1px 3px rgba(0,0,0,0.06)',
                  border: m.rol==='bot' ? '1px solid #E2E8F0' : 'none',
                  ...(m.error && { border:'1px solid #FED7D7' }),
                }}>
                  <Typography sx={{ fontSize:'0.8375rem', lineHeight:1.65, whiteSpace:'pre-wrap', color:'inherit' }}>
                    {m.texto}
                  </Typography>
                </Box>
              </Box>
            ))}

            {loading && (
              <Box sx={{ display:'flex', gap:1.25, alignItems:'flex-end' }}>
                <Avatar sx={{ width:30, height:30, bgcolor:'#1A202C' }}>
                  <SmartToyRoundedIcon sx={{ fontSize:14, color:'#fff' }} />
                </Avatar>
                <Box sx={{ px:1.75, py:1.5, borderRadius:'4px 14px 14px 14px', bgcolor:'#fff', border:'1px solid #E2E8F0', display:'flex', gap:0.5 }}>
                  {[0,1,2].map(j=>(
                    <Box key={j} sx={{
                      width:6, height:6, borderRadius:'50%', bgcolor:'#CBD5E0',
                      animation:`dot 1.2s ease infinite ${j*0.18}s`,
                      '@keyframes dot':{ '0%,80%,100%':{ transform:'translateY(0)' }, '40%':{ transform:'translateY(-5px)' } },
                    }} />
                  ))}
                </Box>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          {/* Input */}
          <Box sx={{ px:2, py:1.5, borderTop:'1px solid #EDF2F7', display:'flex', gap:1, alignItems:'center' }}>
            <TextField inputRef={inputRef} fullWidth size="small" placeholder="Escribe tu pregunta…"
              value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} disabled={loading} />
            <IconButton onClick={()=>send()} disabled={loading||!input.trim()} sx={{
              width:36, height:36, borderRadius:'8px',
              bgcolor:(!input.trim()||loading)?'#EDF2F7':'#E53E3E',
              '&:hover':{ bgcolor:(!input.trim()||loading)?'#E2E8F0':'#C53030' },
              '&.Mui-disabled':{ bgcolor:'#EDF2F7' },
            }}>
              <SendRoundedIcon sx={{ fontSize:16, color:(!input.trim()||loading)?'#A0AEC0':'#fff' }} />
            </IconButton>
          </Box>
        </Paper>

        {/* Panel lateral */}
        <Box sx={{ display:'flex', flexDirection:'column', gap:2 }}>
          <Paper elevation={1} sx={{ borderRadius:'12px', p:'18px' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:1.5 }}>
              <AutoAwesomeRoundedIcon sx={{ color:'#E53E3E', fontSize:15 }} />
              <Typography sx={{ fontWeight:600, fontSize:'0.8125rem' }}>Preguntas sugeridas</Typography>
            </Box>
            <Box sx={{ display:'flex', flexDirection:'column', gap:0.625 }}>
              {SUGERENCIAS.map(s=>(
                <Button key={s.texto} variant="outlined" size="small" disabled={loading}
                  onClick={()=>send(s.texto)}
                  sx={{
                    textAlign:'left', justifyContent:'flex-start',
                    fontSize:'0.775rem', lineHeight:1.4, py:0.875,
                    '&:hover':{ borderColor:'#E53E3E', color:'#E53E3E', bgcolor:'#FFF5F5' },
                  }}
                  startIcon={<span style={{ fontSize:13 }}>{s.emoji}</span>}
                >
                  {s.texto}
                </Button>
              ))}
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ borderRadius:'12px', p:'18px', bgcolor:'#1A202C' }}>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.75, mb:1.25 }}>
              <AutoAwesomeRoundedIcon sx={{ color:'#718096', fontSize:14 }} />
              <Typography sx={{ fontWeight:600, fontSize:'0.8rem', color:'#E2E8F0' }}>Motor de IA</Typography>
            </Box>
            <Typography sx={{ fontSize:'0.775rem', color:'#718096', lineHeight:1.7 }}>
              <strong style={{ color:'#CBD5E0' }}>Google Gemini 2.5 Flash</strong><br/>
              Respuestas basadas en datos reales del inventario.
              <br/><br/>
              <strong style={{ color:'#CBD5E0' }}>Privacidad</strong><br/>
              Solo estadísticas agregadas. Ningún dato personal sale del servidor.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}
