import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { uploadImage } from "../assets/firebase/storage";

const Dhome = () => {
  const [title, setTitle] = useState("");
  const [logo, setLogo] = useState("");
  const [background, setBackground] = useState("");

  // Fetch home settings
  const fetchData = async () => {
    const ref = doc(db, "settings", "home");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setTitle(data.title || "");
      setLogo(data.logo || "");
      setBackground(data.background || "");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save changes
  const handleSave = async () => {
    let logoURL = logo;
    let backgroundURL = background;

    if (logo instanceof File) logoURL = await uploadImage(logo, "home");
    if (background instanceof File)
      backgroundURL = await uploadImage(background, "home");

    await setDoc(doc(db, "settings", "home"), {
      title,
      logo: logoURL,
      background: backgroundURL,
    });

    alert("Home settings updated!");
  };

  // Remove selected file
  const handleRemoveFile = (type) => {
    if (type === "logo") setLogo(null);
    if (type === "background") setBackground(null);
  };

  return (
    <div className="Dhome-page page" style={{ padding: "20px" }}>
      <h1>Home Settings</h1>

      {/* ===== Home Title ===== */}
      <div style={{ marginBottom: "20px" }}>
        <p>Home Title</p>
        <input
          type="text"
          value={title}
          placeholder="Enter home title"
          onChange={(e) => setTitle(e.target.value)}
        
        />
      </div>
      <div className="Logo-Backround-uploader">
        {/* ===== Logo ===== */}
        <div style={{ marginBottom: "20px" }}>
          <p>Logo</p>
          {logo && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: "5px",
              }}
            >
              <img
                src={logo instanceof File ? URL.createObjectURL(logo) : logo}
                alt="logo"
                style={{ width: "150px", borderRadius: "5px" }}
              />
              <button
                onClick={() => handleRemoveFile("logo")}
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  width: "20px",
                  height: "20px",
                }}
              >
                ×
              </button>
            </div>
          )}
          <div>
            <button
              className="custom-file-button"
              onClick={() => document.getElementById("logoInput").click()}
              style={{
                backgroundColor: "#ffccd8",
                padding: "8px 12px",
                borderRadius: "5px",
                marginTop: "5px",
              }}
            >
              Upload Logo
            </button>
            <input
              id="logoInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setLogo(e.target.files[0])}
            />
          </div>
        </div>

        {/* ===== Background ===== */}
        <div style={{ marginBottom: "20px" }}>
          <p>Background</p>
          {background && (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                marginBottom: "5px",
              }}
            >
              <img
                src={
                  background instanceof File
                    ? URL.createObjectURL(background)
                    : background
                }
                alt="background"
                style={{ width: "150px", borderRadius: "5px" }}
              />
              <button
                onClick={() => handleRemoveFile("background")}
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "white",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  width: "20px",
                  height: "20px",
                }}
              >
                ×
              </button>
            </div>
          )}
          <div>
            <button
              className="custom-file-button"
              onClick={() => document.getElementById("backgroundInput").click()}
              style={{
                backgroundColor: "#ffccd8",
                padding: "8px 12px",
                borderRadius: "5px",
                marginTop: "5px",
              }}
            >
              Upload Background
            </button>
            <input
              id="backgroundInput"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setBackground(e.target.files[0])}
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleSave}
        style={{
          marginTop: "20px",
          width: "200px",
          padding: "10px",
          backgroundColor: "#ffccd8",
          borderRadius: "5px",
          fontWeight: "bold",
        }}
      >
        Save
      </button>
    </div>
  );
};

export default Dhome;
