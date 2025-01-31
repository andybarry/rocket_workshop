import React, { useState, useEffect, useMemo, useRef } from "react";

import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";

function ResetAllButton(props) {
  const [pressedOnce, setPressedOnce] = React.useState(false);
  
  function handleButtonClick(e) {
    if (pressedOnce) {
        props.callback()
        setPressedOnce(false)
        return
    }

    setPressedOnce(true)
    setTimeout(() => {
      setPressedOnce(false);
    }, 5000);
  }

  let button = (
    <Button variant="outline-secondary" onClick={handleButtonClick}>
      Reset All
    </Button>
  )
  if (pressedOnce) {
    button = (
        <Button variant="danger" onClick={handleButtonClick}>
          Confirm Reset
        </Button>
      )
  }
  return (
    <>{button}</>
  );
}
export { ResetAllButton };
