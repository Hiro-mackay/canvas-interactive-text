import dynamic from 'next/dynamic';


const Container = dynamic(() => import('../containers'), { ssr: false });

const Page = () => {
  return (
    <div>
      <Container />
    </div>
  );
};

export default Page;
