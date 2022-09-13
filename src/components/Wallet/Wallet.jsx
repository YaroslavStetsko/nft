import React, { useCallback, useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Metaplex } from "@metaplex-foundation/js";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";

// const getCollectionNFT = async () => {
//   const collectionNFT = await metaplex
//     .candyMachines()
//     .findMintedNfts({ candyMachine, version: 2 })
//     .run();
//   setCollectionNFT(collectionNFT);
//   console.log(collectionNFT[1].collection.key.toBase58());
//   console.log(collectionNFT[2].collection.address.toBase58());
// };

// const candyMachine = new PublicKey(
//   "4ocF1GqQRhnhB77zD8S23BDfUshRGwsDAZkwt2oSz4Ht"
// );

const Wallet = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [walletNFT, setWalletNFT] = useState([]);
  const [images, setImages] = useState([]);
  const [isNFTBelongsToCollection, setIsNFTBelongsToCollection] =
    useState(false);

  // Function to Send Sol
  const onClick = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    const lamports = await connection.getMinimumBalanceForRentExemption(0);

    const toPubkey = new PublicKey(
      "HqAwmeuhcmiwEGiTi3Do7jd48mzmW8Ds1QdvyqyAUkbg"
    );

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: toPubkey,
        lamports,
      })
    );

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, {
      minContextSlot,
    });

    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
  }, [publicKey, sendTransaction, connection]);


  // My collection NFT mint address
  const collectionMintId = "B23sM3iVB4EstftVWTJQChKjWDhXNbiX2chGk4jWjYZ";

  const metaplex = new Metaplex(connection);

  useEffect(() => {
    const getWalletNFT = async () => {
      const walletNFT = await metaplex
        .nfts()
        .findAllByOwner({ owner: publicKey })
        .run();

      const getUrl = async (uri) => {
        const { image, name } = await fetch(uri).then((response) =>
          response.json()
        );
        setImages((prevState) => [...prevState, { image, name }]);
      };

      walletNFT.forEach((el) => {
        getUrl(el.uri);
      });

      setWalletNFT(walletNFT);

      console.log(walletNFT);
      // Check if at least one NFT belongs to my collection
      const isNFTBelongsToCollection = await walletNFT.some(
        (el) => el.collection?.key.toBase58() === collectionMintId
      );

      setIsNFTBelongsToCollection(isNFTBelongsToCollection);
      console.log(isNFTBelongsToCollection);
    };

    if (publicKey) {
      getWalletNFT();
    }
  }, [publicKey]);

  return (
    <div>
      <WalletMultiButton />
      {walletNFT.length ? (
        <div>
          {walletNFT.map(({ name }) => {
            const image = images.find((el) => el.name === name);
            return (
              <div key={name}>
                <div>{name}</div>
                <img
                  style={{ width: "100px", height: "100px" }}
                  src={image?.image}
                  alt=""
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div>You dont have any NFTs</div>
      )}
      <div>
        <button
          disabled={!walletNFT.length && !isNFTBelongsToCollection}
          onClick={onClick}
        >
          Sen Sol
        </button>
      </div>
    </div>
  );
};

export default Wallet;
