import { useEffect, useState, useRef } from "react";
import { MouseEvent } from "react";
import Start from "./Start";
import { io } from "socket.io-client";

declare const AgoraRTC: any;

interface VideoChatProps {
  userName: string;
}

const VideoChat = ({ userName }: VideoChatProps) => {
  const CHANNEL = "main";
  const APP_ID = "27d0a69963384171acb138988a2bac45";

  const [localTracks, setLocalTracks] = useState<any[]>([]);
  const [remoteUsers, setRemoteUsers] = useState<Record<string, any>>({});
  const [UserActive, setUserActive] = useState(false);

  const socket = io("http://localhost:8080", {  withCredentials: true }); 
  const [usersJoined, setUsersJoined] = useState(0);
  const [usersClicked, setUsersClicked] = useState(0);

  const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  const videoStreams = useRef<HTMLDivElement | null>(null);
  const streamControls = useRef<HTMLDivElement | null>(null);
  const videoWrapper = useRef<HTMLDivElement | null>(null);

  const userRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const joinAndDisplayLocalStream = async () => {
    try {
    const response = await fetch(
     `http://localhost:8080/access_token?channel=${CHANNEL}&uid=${0}`
    );
    const data = await response.json();

    if (!data.token) {
      throw new Error("Token not received from server");
    }

      client.on("user-published", handleUserJoined);
      client.on("user-left", handleUserLeft); 
      const TOKEN = data.token;

      const UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
      setLocalTracks(tracks);

      const player = document.createElement("div");
      player.id = `user-container-${UID}`;
      player.style.position = 'relative'
      player.innerHTML = `
      <div class="video-player" id="user-${UID}"></div>
      <div class="user-label">${userName}</div>
    `;
      if (videoStreams.current) {
        videoStreams.current.appendChild(player); 
      }

      userRefs.current.set(UID, player);
      setUserActive(true);


      tracks[1].play(`user-${UID}`);
      await client.publish([tracks[0], tracks[1]]);
    } catch (error: any) {
      if (error.message.includes("UID_CONFLICT")) {
        alert("Username is already in use. Please use a different username.");
      } else {
        console.error("Error joining or publishing stream:", error);
      }
    }
  };

  useEffect(() => {
    joinAndDisplayLocalStream(); 
    socket.emit('connection', (response: any) => {
      if(response){
        socket.on('update-users', (count) => {
        console.log(`Number of connected users: ${count}`);
        setUsersJoined(count); // Update your state with the new count
        });
      } else {
        console.log("There was issue in getting a response from server!")
      }

    })


    return () => {
      socket.disconnect();

      client.leave();
      localTracks.forEach((track) => track.stop() && track.close());
      setUserActive(true);
    };
  }, []);

  const handleUserJoined = async (user: any, mediaType: any) => {
    remoteUsers[user.uid] = user; 
    await client.subscribe(user, mediaType); 

    if (mediaType === "video") {
      const existingPlayer = userRefs.current.get(user.uid);
      if (existingPlayer) {
        existingPlayer.remove();
      }

      const player = document.createElement("div");
      player.id = `user-container-${user.uid}`;
      player.style.position = 'relative'
      player.innerHTML = `
      <div class="video-player" id="user-${user.uid}"></div>
      <div class="user-label">${user.uid}</div>`;
      if (videoStreams.current) {
        videoStreams.current.appendChild(player); // Append to the ref container
      }

      userRefs.current.set(user.uid, player);

      user.videoTrack?.play(`user-${user.uid}`); 
    }

    if (mediaType === "audio") {
      user.audioTrack?.play(); 
    }
  };
  

  const handleUserLeft = async (user: any) => {
    console.log(`User ${user.uid} left`);
    const player = userRefs.current.get(user.uid);
    if (player) {
      player.remove();
      userRefs.current.delete(user.uid);
    }
    // Update remoteUsers state (important for React re-renders)
    setRemoteUsers((prevRemoteUsers) => {
      const newRemoteUsers = { ...prevRemoteUsers };
      delete newRemoteUsers[user.uid];
      return newRemoteUsers;
    });
    console.log("Updated remote users:", remoteUsers);

  };

  const toggleMic = async (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.target as HTMLButtonElement; // Explicitly cast to HTMLButtonElement
    if (localTracks[0].muted) {
      await localTracks[0].setMuted(false);
      button.innerText = "Mic off";
      button.style.backgroundColor = "#ce1717";
    } else {
      await localTracks[0].setMuted(true);
      button.innerText = "Mic on";
      button.style.backgroundColor = "#EE4B2B";
    }
  };

  const toggleCamera = async (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.target as HTMLButtonElement;
    if (localTracks[1].muted) {
      await localTracks[1].setMuted(false);
      button.innerText = "Camera off";
      button.style.backgroundColor = "#ce1717";
    } else {
      await localTracks[1].setMuted(true);
      button.innerText = "Camera on";
      button.style.backgroundColor = "#EE4B2B";
    }
  };
 
  if (!UserActive) {
    return <Start />;
  }

  return (
    <div id="video-wrapper" className="video-call-container d-flex flex-column align-items-center" ref={videoWrapper}>
      <div className="video-streams" ref={videoStreams}>{}</div>
      <div className="stream-controls" ref={streamControls}>
        <button className="btn btn-danger" onClick={toggleMic}>
          Mic off
        </button>
        <button className="btn btn-danger" onClick={toggleCamera}>
          Camera off
        </button>
        <button className="btn btn-danger" >
          Game On
        </button>
      </div>
    </div>
  );
};

export default VideoChat;



