import { useEffect, useRef } from 'react'

export default function SurveySuccess({ onRetake }) {
  const headingRef = useRef(null)

  useEffect(() => {
    window.scrollTo(0, 0)
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <div className="success-message survey-success">
      <h2 ref={headingRef} tabIndex={-1}>Thank You!</h2>
      <p>Your feedback has been submitted successfully. We appreciate your input!</p>
      <div className="survey-retake-box">
        <h3>Working in a group?</h3>
        <p>We value each participant’s feedback. Take the survey again so the next person can share their experience.</p>
        <button type="button" className="survey-retake-button" onClick={onRetake}>
          Take the survey again
        </button>
      </div>
      <a className="survey-home-button" href="https://stageoneeducation.com/index.html">Return home</a>
    </div>
  )
}
