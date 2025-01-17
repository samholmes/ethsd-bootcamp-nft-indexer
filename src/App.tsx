import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { Alchemy, Network, Nft, OwnedNftsResponse } from "alchemy-sdk";
import { ethers } from "ethers";
import { useState } from "react";
import { Loader } from "./components/Loader";
import { useWeb3Account } from "./hooks/useWeb3Account";

const { VITE_ALCHEMY_API_KEY } = import.meta.env;

function App() {
  const [account, connect] = useWeb3Account();
  const [userAddress, setUserAddress] = useState("");
  const [ownedNfts, setOwnedNfts] = useState<OwnedNftsResponse["ownedNfts"]>(
    []
  );
  const [hasQueried, setHasQueried] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState<Nft[]>([]);

  const isConnected = account !== "";

  async function getNFTsForOwner() {
    setIsQuerying(true);
    setOwnedNfts([]);

    const config = {
      apiKey: VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);

    let address: string = userAddress;
    try {
      const result = await alchemy.core.resolveName(userAddress);
      if (result != null) {
        address = result;
      }
    } catch (error) {}

    if (!ethers.utils.isAddress(address)) {
      throw new Error("Invalid address");
    }

    const data = await alchemy.nft.getNftsForOwner(address);
    setOwnedNfts(data.ownedNfts);

    const tokenDataPromises = [];

    for (let i = 0; i < data.ownedNfts.length; i++) {
      const tokenData = alchemy.nft.getNftMetadata(
        data.ownedNfts[i].contract.address,
        data.ownedNfts[i].tokenId
      );
      tokenDataPromises.push(tokenData);
    }

    const nfts = await Promise.all(tokenDataPromises);

    setTokenDataObjects(nfts);
    setIsQuerying(false);
    setHasQueried(true);
  }
  return (
    <Box w="100vw">
      <nav>
        <Flex alignItems="center" justifyContent="space-between">
          <h1 className="logo">Ndex</h1>
          {isConnected ? (
            <Box>{account}</Box>
          ) : (
            <Button onClick={connect}>Connect</Button>
          )}
        </Flex>
      </nav>
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            NFT Indexer 🖼
          </Heading>
          <Text>
            Plug in an address and this website will return all of its NFTs!
          </Text>
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>Get all the ERC-721 tokens of this address:</Heading>
        <Input
          placeholder="Enter ethereum address or domain"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setUserAddress(event.target.value)
          }
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getNFTsForOwner} mt={36} bgColor="blue">
          Fetch NFTs
        </Button>

        <Heading my={36}>Here are your NFTs:</Heading>

        {isQuerying ? <Loader /> : null}

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {ownedNfts.map((nft, i) => {
              const image = tokenDataObjects[i].rawMetadata?.image;
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="#111"
                  w={"20vw"}
                  key={nft.tokenId}
                  borderRadius={6}
                  padding={12}
                >
                  <Box>
                    <b>Name:</b> {tokenDataObjects[i].title}&nbsp;
                  </Box>
                  <Image src={image} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : null}
      </Flex>
    </Box>
  );
}

export default App;
