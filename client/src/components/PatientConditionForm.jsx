import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./PatientConditionForm.css";
import Navbar from "./Navbar";
import axios from "axios";

const PatientConditionForm = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [condition, setCondition] = useState({
    healthStatus: "",
    type: "Organ",
    organNeeded: "",
    bloodType: "",
    urgency: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [registeredBloodGroup, setRegisteredBloodGroup] = useState("");

  // Fetch existing condition and registered blood group
  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/patients/${patientId}`)
      .then((res) => {
        const patient = res.data;
        if (patient.condition) {
          setCondition((prev) => ({ ...prev, ...patient.condition }));
        }
        if (patient.bloodGroup) {
          setRegisteredBloodGroup(patient.bloodGroup); // ✅ Important
        }
      })
      .catch((err) => console.error("❌ Error fetching patient condition:", err));
  }, [patientId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "type") {
      setCondition({ ...condition, type: value, organNeeded: "", bloodType: "" });
    } else if (name === "organNeeded" && value !== "Blood") {
      // Reset blood type if organ isn't Blood
      setCondition({ ...condition, organNeeded: value, bloodType: "" });
    } else {
      setCondition({ ...condition, [name]: value });
    }
  };

  // Validation
  const validate = () => {
    const newErrors = {};

    if (!condition.healthStatus.trim())
      newErrors.healthStatus = "Health Status is required.";

    if (condition.type === "Organ" && !condition.organNeeded)
      newErrors.organNeeded = "Please select an organ.";

    if (!condition.urgency) newErrors.urgency = "Please select urgency level.";

    if (condition.notes.length > 300)
      newErrors.notes = "Notes cannot exceed 300 characters.";

    // ✅ Blood group validation: always check if selected bloodType exists
    if (!condition.bloodType) {
      newErrors.bloodType = "Please select a blood type.";
    } else if (
      registeredBloodGroup &&
      condition.bloodType !== registeredBloodGroup
    ) {
      newErrors.bloodType = `❌ Selected blood group (${condition.bloodType}) does not match patient's registered blood group (${registeredBloodGroup}).`;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Ensure registeredBloodGroup is loaded
    if (!registeredBloodGroup) {
      alert("Fetching patient data, please wait...");
      return;
    }

    if (!validate()) return;

    try {
      await axios.put(
        `http://localhost:5000/api/patients/${patientId}/condition`,
        condition
      );
      alert("✅ Patient condition saved successfully!");
    } catch (err) {
      console.error("❌ Error saving condition:", err);
      alert("Failed to save condition.");
    }
  };

  const handleBackToDashboard = () => {
    navigate("/hospital/dashboard");
  };

  return (
    <>
      <Navbar />
      <div className="patient-condition-page">
        <div className="condition-form-container glass animate-slide-in">
          <h2>Patient Condition Form</h2>
          <form onSubmit={handleSubmit}>
            {/* Health Status */}
            <label>Health Status:</label>
            <input
              name="healthStatus"
              value={condition.healthStatus}
              onChange={handleChange}
              placeholder="Enter patient's health status"
            />
            {errors.healthStatus && (
              <span className="error">{errors.healthStatus}</span>
            )}

            {/* Type */}
            <label>Type:</label>
            <select name="type" value={condition.type} onChange={handleChange}>
              <option value="Organ">Organ</option>
              <option value="Blood">Blood</option>
            </select>

            {/* Organ selection */}
            {condition.type === "Organ" && (
              <>
                <label>Organ Needed:</label>
                <select
                  name="organNeeded"
                  value={condition.organNeeded}
                  onChange={handleChange}
                >
                  <option value="">Select Organ</option>
                  <option value="Kidney">Kidney</option>
                  <option value="Partial Liver">Partial Liver</option>
                  <option value="Cornea">Cornea</option>
                  <option value="Bone Marrow">Bone Marrow</option>
                  <option value="Heart">Heart</option>
                  <option value="Lungs">Lungs</option>
                  <option value="Pancreas">Pancreas</option>
                  <option value="Blood">Blood</option>
                </select>
                {errors.organNeeded && (
                  <span className="error">{errors.organNeeded}</span>
                )}
              </>
            )}

            {/* Blood Type selection */}
            <label>Blood Type:</label>
            <select
              name="bloodType"
              value={condition.bloodType}
              onChange={handleChange}
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            {errors.bloodType && <span className="error">{errors.bloodType}</span>}

            {/* Urgency */}
            <label>Urgency:</label>
            <select
              name="urgency"
              value={condition.urgency}
              onChange={handleChange}
            >
              <option value="">Select</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            {errors.urgency && <span className="error">{errors.urgency}</span>}

            {/* Notes */}
            <label>Notes:</label>
            <textarea
              name="notes"
              value={condition.notes}
              onChange={handleChange}
              placeholder="Any additional notes"
            />
            {errors.notes && <span className="error">{errors.notes}</span>}

            {/* Buttons */}
            <div className="button-row">
              <button
                type="submit"
                className="form-action-btn"
                disabled={!registeredBloodGroup} // prevent early submit
              >
                Save Condition
              </button>
              <button
                type="button"
                className="form-action-btn"
                onClick={handleBackToDashboard}
              >
                Back to Dashboard
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PatientConditionForm;
