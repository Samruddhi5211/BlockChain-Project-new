// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Candidate {
        string name;
        uint256 voteCount;
        string imageHash;
        string partyName;
    }

    struct Voter {
        string aadhaarNumber;
        bool hasVoted;
        bool isRegistered;
        bytes32 irisHash;
    }

    address public owner;
    uint256 public votingStart;
    uint256 public votingEnd;
    bool public electionStarted = false;
    uint256 public durationInMinutes;

    Candidate[] public candidates;
    mapping(address => Voter) public voters;
    mapping(string => bool) private registeredAadhaar;
    mapping(string => bool) private existingCandidates;

    event VoterRegistered(address voter, string aadhaarNumber);
    event Voted(address voter, uint256 candidateIndex);
    event CandidateAdded(string name, string party, string imageHash);
    event ElectionStarted(uint256 startTime, uint256 endTime);
    event ElectionEnded(uint256 endTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only admin can perform this action.");
        _;
    }

    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "You are not registered.");
        _;
    }

    modifier onlyDuringElection() {
        require(electionStarted && block.timestamp >= votingStart && block.timestamp < votingEnd, "Election is not active.");
        _;
    }

    constructor(uint256 _durationInMinutes) {
        owner = msg.sender;
        durationInMinutes = _durationInMinutes;
    }

    function startElection(uint256 _durationInMinutes) public onlyOwner {
        votingStart = block.timestamp;
        votingEnd = block.timestamp + (_durationInMinutes * 1 minutes);
        electionStarted = true;
        emit ElectionStarted(votingStart, votingEnd);
    }

    function endElection() public onlyOwner {
        require(electionStarted, "Election has not started yet.");
        electionStarted = false;
        emit ElectionEnded(block.timestamp);
    }

    function registerVoter(string memory _aadhaarNumber, bytes32 _irisHash) public {
        require(!voters[msg.sender].isRegistered, "Already registered.");
        require(!registeredAadhaar[_aadhaarNumber], "Aadhaar already registered.");

        voters[msg.sender] = Voter({
            aadhaarNumber: _aadhaarNumber,
            hasVoted: false,
            isRegistered: true,
            irisHash: _irisHash
        });

        registeredAadhaar[_aadhaarNumber] = true;
        emit VoterRegistered(msg.sender, _aadhaarNumber);
    }

    function isUserRegistered(string memory _aadhaarNumber) public view returns (bool) {
        return registeredAadhaar[_aadhaarNumber];
    }

    function loginVoter(string memory _aadhaarNumber, bytes32 _irisHash) public view returns (bool) {
        require(voters[msg.sender].isRegistered, "You are not registered.");
        require(
            keccak256(abi.encodePacked(voters[msg.sender].aadhaarNumber)) ==
            keccak256(abi.encodePacked(_aadhaarNumber)),
            "Invalid Aadhaar number."
        );
        require(voters[msg.sender].irisHash == _irisHash, "Iris authentication failed.");
        return true;
    }

    function addCandidate(string memory _name, string memory _imageHash, string memory _partyName) public onlyOwner {
        require(!existingCandidates[_name], "Candidate already exists.");
        
        candidates.push(Candidate({
            name: _name,
            voteCount: 0,
            imageHash: _imageHash,
            partyName: _partyName
        }));

        existingCandidates[_name] = true;
        emit CandidateAdded(_name, _partyName, _imageHash);
    }

    function vote(uint256 _candidateIndex) public onlyRegisteredVoter onlyDuringElection {
        require(!voters[msg.sender].hasVoted, "You already voted.");
        require(_candidateIndex < candidates.length, "Invalid candidate index.");

        candidates[_candidateIndex].voteCount++;
        voters[msg.sender].hasVoted = true;

        emit Voted(msg.sender, _candidateIndex);
    }

    function getAllCandidates() public view returns (string[] memory, uint256[] memory, string[] memory, string[] memory) {
        string[] memory names = new string[](candidates.length);
        uint256[] memory votes = new uint256[](candidates.length);
        string[] memory imageHashes = new string[](candidates.length);
        string[] memory partyNames = new string[](candidates.length);

        for (uint256 i = 0; i < candidates.length; i++) {
            names[i] = candidates[i].name;
            votes[i] = candidates[i].voteCount;
            imageHashes[i] = candidates[i].imageHash;
            partyNames[i] = candidates[i].partyName;
        }
        
        return (names, votes, imageHashes, partyNames);
    }

    function getCandidateVotes(uint256 _candidateIndex) public view returns (uint256) {
        require(_candidateIndex < candidates.length, "Invalid candidate index.");
        return candidates[_candidateIndex].voteCount;
    }

    function getVotingStatus() public view returns (bool) {
        return electionStarted && (block.timestamp >= votingStart && block.timestamp < votingEnd);
    }
}
