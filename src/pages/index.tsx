import { useState } from 'react';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import { FiCalendar, FiUser } from "react-icons/fi";
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Link from 'next/link';
import Head from 'next/head';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [nextPage, setNextPage] = useState<string>(postsPagination.next_page);

  async function handleNextPosts(pageURL: RequestInfo) {
    if (pageURL != null || pageURL !== undefined) {
      const postsResponse: PostPagination = await fetch(pageURL).then(
        response => response.json()
      );

      const nextPosts = postsResponse.results.map(post => {
        return {
          uid: post.uid,
          first_publication_date: format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, }),
          data: {
            title: post.data.title,
            subtitle: post.data.subtitle,
            author: post.data.author,
          },
        };
      });

      setPosts([...posts, ...nextPosts]);
      setNextPage(postsResponse.next_page);
    }
  }

  return (
    <>
      <Head>
        <title>
          Posts | spacetraveling
        </title>
      </Head>

      <Header />
      <main className={commonStyles.container}>
        <article className={styles.content}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div>
                  <div>
                    <FiCalendar color='#BBBBBB' />
                    <time>{format(new Date(post.first_publication_date), "dd MMM yyyy", { locale: ptBR, })}</time>
                  </div>
                  <div>
                    <FiUser color='#BBBBBB' />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </article>
        {!!nextPage && (
          <button
            type='button'
            onClick={() => handleNextPosts(nextPage)}
            className={styles.button}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
  });

  //console.log(JSON.stringify(postsResponse, null, 2));

  const next_page = postsResponse.next_page;

  const results = postsResponse.results.map(result => {
    return {
      uid: result.uid,
      first_publication_date: result.first_publication_date,
      data: result.data
    }
  });

  const postsPagination = {
    next_page,
    results
  }

  return {
    props: { postsPagination },
    revalidate: 60 * 30, //30 minutes
  }
};
