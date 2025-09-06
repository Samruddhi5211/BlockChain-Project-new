import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { web3, votingContract } from "../Constant/constant";

const Login = () => {
    const [aadhaar, setAadhaar] = useState("");
    const [irisImage, setIrisImage] = useState(null);
    const [account, setAccount] = useState("");
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    // Capture iris scan from webcam
    const captureIris = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setIrisImage(imageSrc);
    };

    // Check if the Aadhaar number is registered on the blockchain
    const checkUserRegistration = async (aadhaarNumber) => {
        try {
            const isRegistered = await votingContract.methods.isUserRegistered(aadhaarNumber).call();
            return isRegistered;
        } catch (error) {
            console.error("Error checking registration:", error);
            return false;
        }
    };

    // Handle user login
    const handleLogin = async () => {
        if (!aadhaar || !irisImage) {
            alert("Please enter Aadhaar and capture iris scan!");
            return;
        }

        try {
            const accounts = await web3.eth.requestAccounts();
            setAccount(accounts[0]);

            const isRegistered = await checkUserRegistration(aadhaar);
            if (!isRegistered) {
                alert("Aadhaar is not registered. Please register first.");
                return;
            }

            const response = await fetch("http://127.0.0.1:5001/login-iris", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ aadhaar, irisImage }),
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("userAadhaar", aadhaar);
                alert("Login successful!");
                navigate("/connected");
            } else {
                alert(data.error || "Iris verification failed.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Failed to login. Try again.");
        }
    };

    return (
        <div className="login-page">
            <div className="form-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="form-left" style={{ flex: 1, paddingRight: "2rem" }}>
                    <h2>Voter Login</h2>
                    <input
                        type="text"
                        placeholder="Aadhaar Number"
                        value={aadhaar}
                        onChange={(e) => setAadhaar(e.target.value)}
                        style={{ marginBottom: "1rem", width: "100%", padding: "0.5rem" }}
                    />
                    <Webcam
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        style={{ width: "100%", marginBottom: "1rem" }}
                    />
                    <button onClick={captureIris} style={{ marginRight: "1rem" }}>Capture Iris</button>
                    <button onClick={handleLogin}>Login</button>
                    {/* Optional Preview */}
                    {/* {irisImage && (
                        <div style={{ marginTop: "1rem" }}>
                            <img src={irisImage} alt="Captured Iris" width="100" />
                        </div>
                    )} */}
                </div>
                <div className="form-right" style={{ flex: 1 }}>
                    <img src="/imgreg2.jpeg" alt="Registration Visual" style={{ width: "100%", borderRadius: "8px" }} />
                </div>
            </div>
        </div>
    );
};

export default Login;
