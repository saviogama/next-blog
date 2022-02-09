import { GetStaticPaths, GetStaticProps } from 'next';
import { getPrismicClient } from '../../services/prismic';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { route } from 'next/dist/next-server/server/router';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  function wordCount(): number {
    const bodyText = post.data.content.reduce((previous, current) => {
      const text = RichText.asText(current.body);
      if (!text) {
        return previous;
      }
      return previous.concat(text);
    }, '');

    const postWords = bodyText.split(' ');

    return postWords.length;
  }

  const time = Math.ceil(wordCount() / 200);

  return (
    <>
      <Head>
        <title>
          {post.data.title} | spacetraveling
        </title>
      </Head>

      <Header />
      {router.isFallback ? (
        <span className={styles.loading}>Carregando...</span>
      ) : (
        <>
          <div className={styles.bannerContainer}>
            <img className={styles.bannerImg} src={post.data.banner.url} alt='logo' />
          </div><main className={commonStyles.container}>
            <article className={styles.content}>
              <h1>{post.data.title}</h1>
              <div>
                <div>
                  <FiCalendar color='#BBBBBB' />
                  <time>{format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })}</time>
                </div>
                <div>
                  <FiUser color='#BBBBBB' />
                  <span>{post.data.author}</span>
                </div>
                <div>
                  <FiClock color='#BBBBBB' />
                  <time>{time} min</time>
                </div>
              </div>
              {post.data.content.map(content => (
                <section key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div className={styles.postContent} dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }} />
                </section>
              ))}
            </article>
          </main>
        </>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  });

  const paths = [];

  posts.results.map(post => {
    paths.push({
      params: {
        slug: post.uid,
      },
    });
    return post;
  });

  return {
    paths: paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async context => {
  const slug = context.params.slug;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  //console.log(JSON.stringify(response, null, 2));

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content
    },
  }

  return {
    props: { post },
    revalidate: 60 * 30
  }
};
