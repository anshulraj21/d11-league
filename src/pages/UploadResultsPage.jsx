import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useLeague } from '../hooks/useLeague'
import { useMatches } from '../hooks/useMatches'
import { extractTextFromImage } from '../lib/ocr'
import { parseLeaderboardText, matchTeamsToMembers } from '../lib/ocrParser'
import Navbar from '../components/layout/Navbar'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'
import Badge from '../components/ui/Badge'

export default function UploadResultsPage() {
  const { leagueId, matchId } = useParams()
  const { user, profile } = useAuth()
  const { league } = useLeague(leagueId)
  const { matches } = useMatches(leagueId)
  const navigate = useNavigate()

  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [ocrStatus, setOcrStatus] = useState('idle') // idle | processing | done | error
  const [ocrResults, setOcrResults] = useState(null)
  const [rawText, setRawText] = useState('')
  const [manualMode, setManualMode] = useState(false)
  const [manualResults, setManualResults] = useState([])
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const match = matches.find((m) => m.id === matchId)
  const members = league?.members || {}

  const handleFileSelect = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setOcrResults(null)
    setOcrStatus('idle')
  }

  const handleOcr = async () => {
    if (!file) return
    setOcrStatus('processing')

    try {
      const text = await extractTextFromImage(file)
      setRawText(text)

      const parsed = parseLeaderboardText(text)
      if (parsed.length === 0) {
        setOcrStatus('error')
        initManualMode()
        return
      }

      const { matched, unmatched } = matchTeamsToMembers(parsed, members)
      setOcrResults({ matched, unmatched, parsed })
      setOcrStatus('done')
    } catch (err) {
      console.error('OCR Error:', err)
      setOcrStatus('error')
      initManualMode()
    }
  }

  const initManualMode = () => {
    setManualMode(true)
    const joinedMembers = match?.joinedMembers || []
    setManualResults(
      joinedMembers.map((uid) => ({
        userId: uid,
        displayName: members[uid]?.displayName || '',
        dream11TeamName: members[uid]?.dream11TeamName || '',
        points: '',
        rank: '',
      }))
    )
  }

  const updateManualResult = (index, field, value) => {
    const updated = [...manualResults]
    updated[index] = { ...updated[index], [field]: value }
    setManualResults(updated)
  }

  const handleSave = async () => {
    setSaving(true)

    let results
    if (manualMode) {
      results = manualResults
        .filter((r) => r.points)
        .map((r, i) => ({
          userId: r.userId,
          displayName: r.displayName,
          dream11TeamName: r.dream11TeamName,
          points: parseFloat(r.points),
          rank: parseInt(r.rank) || i + 1,
        }))
        .sort((a, b) => b.points - a.points)
        .map((r, i) => ({ ...r, rank: i + 1 }))
    } else {
      results = ocrResults.matched
        .sort((a, b) => b.points - a.points)
        .map((r, i) => ({
          userId: r.userId,
          displayName: r.displayName,
          dream11TeamName: r.matchedTeamName,
          points: r.points,
          rank: i + 1,
        }))
    }

    // Convert screenshot to base64 (stored directly in Firestore, no Storage needed)
    let screenshotBase64 = ''
    if (file) {
      screenshotBase64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
    }

    // Write audit history
    await addDoc(collection(db, 'leagues', leagueId, 'matches', matchId, 'history'), {
      changedBy: { userId: user.uid, displayName: profile?.displayName || user.email },
      timestamp: new Date(),
      action: match.results?.length > 0 ? 'results_updated' : 'results_added',
      previousResults: match.results || [],
      newResults: results,
    })

    await updateDoc(doc(db, 'leagues', leagueId, 'matches', matchId), {
      results,
      screenshotUrl: screenshotBase64,
      ocrRawText: rawText,
      status: 'completed',
    })

    setSaving(false)
    navigate(`/league/${leagueId}/match/${matchId}`)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-lg mx-auto p-4 mt-6">
        <h1 className="text-2xl font-bold mb-2">Upload Results</h1>
        <p className="text-text-muted text-sm mb-6">
          {match?.matchName} &middot; Upload Dream11 leaderboard screenshot
        </p>

        {/* File Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-surface-lighter rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
        >
          {preview ? (
            <img src={preview} alt="Screenshot" className="max-h-64 mx-auto rounded-lg" />
          ) : (
            <>
              <p className="text-text-muted">Click to upload screenshot</p>
              <p className="text-xs text-text-muted mt-1">PNG, JPG up to 10MB</p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* OCR / Manual Toggle */}
        {file && ocrStatus === 'idle' && (
          <div className="space-y-2 mb-4">
            <Button className="w-full" onClick={handleOcr}>
              Extract Results (OCR)
            </Button>
            <Button className="w-full" variant="secondary" onClick={initManualMode}>
              Enter Manually
            </Button>
          </div>
        )}

        {/* OCR Processing */}
        {ocrStatus === 'processing' && (
          <div className="text-center py-8">
            <Spinner />
            <p className="text-text-muted mt-2">Reading screenshot... This may take a moment.</p>
          </div>
        )}

        {/* OCR Error */}
        {ocrStatus === 'error' && !manualMode && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-danger">Could not extract results from the screenshot.</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={initManualMode}>
              Enter Manually
            </Button>
          </div>
        )}

        {/* OCR Results Review */}
        {ocrStatus === 'done' && ocrResults && !manualMode && (
          <div className="space-y-4 mb-4">
            <h3 className="font-semibold">Matched Results</h3>
            <div className="bg-surface-light border border-surface-lighter rounded-xl overflow-hidden">
              {ocrResults.matched.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 ${
                    i < ocrResults.matched.length - 1 ? 'border-b border-surface-lighter' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{r.displayName}</p>
                    <p className="text-xs text-text-muted">
                      OCR: "{r.teamName}" → {r.matchedTeamName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{r.points} pts</p>
                    <Badge variant={r.confidence === 'exact' ? 'success' : r.confidence === 'high' ? 'primary' : 'accent'}>
                      {r.confidence}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {ocrResults.unmatched.length > 0 && (
              <>
                <h3 className="font-semibold text-accent">Unmatched ({ocrResults.unmatched.length})</h3>
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-3 text-sm">
                  {ocrResults.unmatched.map((r, i) => (
                    <p key={i}>"{r.teamName}" — {r.points} pts</p>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} loading={saving}>
                Confirm Results
              </Button>
              <Button variant="secondary" className="flex-1" onClick={initManualMode}>
                Edit Manually
              </Button>
            </div>
          </div>
        )}

        {/* Manual Entry */}
        {manualMode && (
          <div className="space-y-4 mb-4">
            <h3 className="font-semibold">Enter Points Manually</h3>
            <div className="space-y-2">
              {manualResults.map((r, i) => (
                <div key={r.userId} className="bg-surface-light border border-surface-lighter rounded-lg p-3">
                  <p className="text-sm font-medium mb-2">{r.displayName} <span className="text-text-muted">({r.dream11TeamName})</span></p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Points"
                      value={r.points}
                      onChange={(e) => updateManualResult(i, 'points', e.target.value)}
                      className="flex-1 px-2 py-1 bg-surface border border-surface-lighter rounded text-text text-sm"
                      step="0.5"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={handleSave} loading={saving}>
              Save Results
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
