const { ethers } = require("ethers");
const contract = require("../artifacts/contracts/ChiknMarketPlaceNFT.sol/ChiknMarketPlaceNFT.json");
const readline = require("readline");
const fsPath = require("path");
const { FilebaseClient } = require("@filebase/client");
const { filesFromPath } = require("files-from-path");
const { json } = require("hardhat/internal/core/params/argumentTypes");
const fs = require("fs");

const contractAddress = process.env.contractAddress;
const privateKey=process.env.privateKey;
const apiKeyFilebase=process.env.apiKeyFilebase;
const apiSecretFilebase=process.env.apiSecretFilebase;

const getContract = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://api.avax-test.network/ext/bc/C/rpc",
    {
      ensAddress: null,
      chainId: 43113,
      signer: new ethers.Wallet(privateKey),
    }
  );

  const wallet = new ethers.Wallet(privateKey, provider);

  const contractInstance = new ethers.Contract(
    contractAddress,
    contract.abi,
    wallet
  );

  return contractInstance;
};

const mintChiknMarketPlaceNFT = async (reciever, tokenURI) => {
  try {
    const transactionContract = await getContract();
    const mintedNFTtoken = await transactionContract.mintChiknMarketPlaceNFT(
      reciever,
      tokenURI
    );
    await mintedNFTtoken.wait();
    console.log(`Success - ${mintedNFTtoken}`);
  } catch (err) {
    console.error(err);
  }
};

// mintChiknMarketPlaceNFT(tokenURI);

const promptUser = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const filePath = await new Promise((resolve) => {
    rl.question("Enter the path to the image file: ", (answer) => {
      resolve(answer);
    });
  });

  const reciever = await new Promise((resolve) => {
    rl.question("Enter the NFT reciever's address: ", (answer) => {
      resolve(answer);
    });
  });

  return { reciever, filePath };
};

const promptMetadata = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const tokenURI = await new Promise((resolve) => {
    rl.question("Enter the NFT's token URI: ", (answer) => {
      resolve(answer);
    });
  });

  rl.close();

  return { tokenURI };
};

async function upload(api, options) {
  console.log(`Parsing options...`);
  const { path, pinName, verbose } = options;

  let source = path;
  if (!fsPath.isAbsolute(source)) {
    const dir = process.cwd().toString();
    source = fsPath.join(dir, source);
  }

  console.log(`Adding files...`);
  const files = [];
  for await (const file of filesFromPath(source, { pathPrefix: source })) {
    files.push(file);
    if (verbose) {
      console.log(`Added File: ${JSON.stringify(file)}`);
    }
  }

  console.log(`Storing files...`);
  let tokenString = `${api.key}:${api.secret}:${api.bucket}`;
  let cid = await FilebaseClient.storeDirectory(
    {
      endpoint: "https://s3.filebase.com",
      token: Buffer.from(tokenString).toString("base64"),
    },
    files,
    pinName
  );
  console.log(`Stored files...`);
  console.log(`CID: ${cid}`);
  console.log(`Done`);

  return {
    cid: cid,
    ipfs: cid,
  };
}

const uploadImage = async (filePath) => {
  try {
    await upload(
      {
        key: apiKeyFilebase,
        secret: apiSecretFilebase,
        bucket: "nft-market-place",
      },
      {
        path: filePath,
        pinName: "myFirstIpfs3Pin",
      }
    );
  } catch (err) {
    console.error(err.message);
  }
  // const filebase = new Filebase({ token: apiKeyFilebase });
  // try {
  //   const uploadResponse = await filebase.upload(filePath);
  //   return uploadResponse.data.url;
  // } catch (err) {
  //   console.error(err);
  // }
};

const createMetadata = () => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question("Enter NFT name: ", (name) => {
      rl.question("Enter NFT description: ", (description) => {
        rl.question("Enter NFT image URL: ", (image) => {
          rl.question("Enter NFT background color: ", (background) => {
            const attributes = [
              { trait_type: "Background", value: background },
            ];
            const nft = { name, description, image, attributes };
            const json = JSON.stringify(nft, null, 2);
            fs.writeFileSync("nft.json", json);
            console.log("NFT file created successfully!");
            rl.close();
            resolve(json);
          });
        });
      });
    });
  });
};

const main = async () => {
  // const { reciever, filePath } = await promptUser();
  // await uploadImage(filePath);
  const metadata = await createMetadata();
  // await uploadImage(metadata);
  // const { tokenURI } = await promptMetadata();

  // await mintChiknMarketPlaceNFT(reciever, tokenURI);
};

main();
