import { useEffect, useState } from "react";
import SecureLS from "secure-ls";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { useNavigate } from "react-router-dom";

const ls = new SecureLS({ encodingType: "aes" });

const Profile = () => {
  const [user, setUser] = useState(null);
  const [ordersStatus, setOrdersStatus] = useState({});
  const [editing, setEditing] = useState({
    name: false,
    phone: false,
    location: false,
  });

  const [tempData, setTempData] = useState({});
  const [tempLocation, setTempLocation] = useState(null);

  const navigate = useNavigate();
  const uid = ls.get("uid");

  useEffect(() => {
    const fetchUser = async () => {
      if (!uid) return;

      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser(data);
        setTempData(data);

        if (data.purchases) {
          let statuses = {};

          for (let p of data.purchases) {
            const orderRef = doc(db, "orders", p.orderId);
            const orderSnap = await getDoc(orderRef);

            if (orderSnap.exists()) {
              statuses[p.orderId] = orderSnap.data().status;
            }
          }

          setOrdersStatus(statuses);
        }
      }
    };

    fetchUser();
  }, [uid]);

  // FIXED SAVE
  const handleSave = async (field, value) => {
    try {
      const userRef = doc(db, "users", uid);

      await updateDoc(userRef, {
        [field]: value,
      });

      setUser({
        ...user,
        [field]: value,
      });

      setTempData({
        ...tempData,
        [field]: value,
      });

      setEditing({
        ...editing,
        [field]: false,
      });

      setTempLocation(null);
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  if (!user) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>Profile</h1>
      <hr />

      <div className="user-info">
        <div>
          <h3>Name:</h3>
          {editing.name ? (
            <>
              <input
                value={tempData.name}
                onChange={(e) =>
                  setTempData({
                    ...tempData,
                    name: e.target.value,
                  })
                }
              />
              <button onClick={() => handleSave("name", tempData.name)}>
                Save
              </button>
            </>
          ) : (
            <>
              <p>{user.name}</p>
              <button onClick={() => setEditing({ ...editing, name: true })}>
                Edit
              </button>
            </>
          )}
        </div>

        <div>
          <h3>Email:</h3>
          <p>{user.email}</p>
        </div>

        <div>
          <h3>Phone:</h3>
          {editing.phone ? (
            <>
              <input
                value={tempData.phone}
                onChange={(e) =>
                  setTempData({
                    ...tempData,
                    phone: e.target.value,
                  })
                }
              />
              <button onClick={() => handleSave("phone", tempData.phone)}>
                Save
              </button>
            </>
          ) : (
            <>
              <p>{user.phone}</p>
              <button onClick={() => setEditing({ ...editing, phone: true })}>
                Edit
              </button>
            </>
          )}
        </div>

        <div>
          <h3>Location:</h3>

          {editing.location ? (
            <div className="Profile-Map">
          

              {tempLocation && (
                <p>
                  <strong>Selected:</strong> {tempLocation.address}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  onClick={() =>
                    handleSave(
                      "location",
                      tempLocation || user.location
                    )
                  }
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setEditing({
                      ...editing,
                      location: false,
                    });
                    setTempLocation(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : user.location ? (
            <p>{user.location.address}</p>
          ) : (
            <p>No location set.</p>
          )}

          {!editing.location && (
            <button
              onClick={() =>
                setEditing({
                  ...editing,
                  location: true,
                })
              }
            >
              Edit Location
            </button>
          )}
        </div>
      </div>

      <hr />
      <h2>Past Purchases</h2>

      <div className="purchases">
        {user.purchases?.length > 0 ? (
          user.purchases.map((p, i) => (
            <div key={i}>
              <div className="purchase-card">
                <p className="purchase-card-id">
                  Order ID: {p.orderId}
                </p>

                <p className="purchase-card-status">
                  Status: {ordersStatus[p.orderId] || "pending"}
                </p>

                <button
                  className="purchase-card-button"
                  onClick={() =>
                    navigate(`/purchasedetail/${p.orderId}`)
                  }
                >
                  View Details
                </button>
              </div>

              <hr />
            </div>
          ))
        ) : (
          <p>No purchases yet</p>
        )}
      </div>
    </div>
  );
};

export default Profile;