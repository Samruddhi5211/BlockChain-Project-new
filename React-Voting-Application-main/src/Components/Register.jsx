import React, { useState, useRef } from "react";
import Webcam from "react-webcam";
import { useNavigate } from "react-router-dom";
import { web3, votingContract } from "../Constant/constant";
import "../Components/Register.css";
import sha256 from "crypto-js/sha256";

const Register = () => {
    const [aadhaar, setAadhaar] = useState("");
    const [irisImage, setIrisImage] = useState(null);
    const webcamRef = useRef(null);
    const navigate = useNavigate();

    const captureIris = () => {
        const imageSrc = webcamRef.current.getScreenshot();
        setIrisImage(imageSrc);
    };

    const checkAadhaarRegistered = async () => {
        try {
            const isRegistered = await votingContract.methods.isUserRegistered(aadhaar).call();
            return isRegistered;
        } catch (error) {
            console.error("Error checking Aadhaar:", error);
            return false;
        }
    };

    const handleRegister = async () => {
        if (!aadhaar || !irisImage) {
            alert("Please enter Aadhaar and capture iris scan!");
            return;
        }

        const accounts = await web3.eth.getAccounts();
        const userAddress = accounts[0];

        try {
            const isAlreadyRegistered = await checkAadhaarRegistered();
            if (isAlreadyRegistered) {
                alert("Aadhaar number already registered!");
                return;
            }

            // Convert iris image to a hash for security
            const irisHash = "0x" + sha256(irisImage).toString();

            await votingContract.methods.registerVoter(aadhaar, irisHash).send({ from: userAddress });
            alert("Registration successful!");
            navigate("/login");
        } catch (error) {
            console.error("Registration error:", error);
            alert("Failed to register. Try again.");
        }
    };

    return (
        <div className="register-page">
            <div className="form-container">
            <div className="form-left" style={{ flex: 1, paddingRight: "2rem" }}>
                <h2>Voter Registration</h2>
                <input
                    type="text"
                    placeholder="Aadhaar Number"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                />
                <Webcam ref={webcamRef} screenshotFormat="image/jpeg" />
                <button onClick={captureIris}>Capture Iris</button>
                {/* {irisImage && <img src={irisImage} alt="Captured Iris" style={{ width: "100px" }} />} */}
                <button onClick={handleRegister}>Register</button></div>
                <div className="form-right" style={{ flex: 1 }}>
                    <img src="/imgreg2.jpeg" alt="Registration Visual" style={{ width: "100%", borderRadius: "8px" }} />
                </div>
            </div>
        </div>
    );
};

export default Register;
