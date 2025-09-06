async function main() {
  const [deployer] = await ethers.getSigners(); // Get deployer account
  console.log("Deploying contract with account:", deployer.address);

  const Voting = await ethers.getContractFactory("Voting");

  // Ensure constructor argument matches contract
  const votingDuration = 2; // Duration in minutes
  const Voting_ = await Voting.deploy(votingDuration);  

  await Voting_.deployed();
  console.log("Contract deployed at:", Voting_.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Deployment error:", error);
    process.exit(1);
  });
