import { useState } from "react";
import VideoChat from "./VideoChat";

const Start = () => {
  const [userName, setUserName] = useState("");
  const [showVideoChat, setShowVideoChat] = useState(false); 

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(`Welcome ${userName}!`)
    if (userName.trim() !== "") {
      setShowVideoChat(true); 
    } else {
      alert("Please enter a valid username.");
    }
  };

  if (showVideoChat) {
    return <VideoChat userName={userName} />;
  }

  return (
    <div className="main-div d-flex justify-content-center">
      <form
        action=""
        className="username d-flex flex-column align-items-center"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Enter Username"
          className="form-control"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
        <button type="submit" className="btn btn-danger">
          Start Game
        </button>
      </form>
    </div>
  );
};

export default Start;
