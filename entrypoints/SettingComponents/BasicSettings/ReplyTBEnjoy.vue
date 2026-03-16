<template></template>

<script>
const emojiSet = [
	{
		size: '30x30',
		name: 'tieba_001',
		url: 'https://linux.do/uploads/default/original/3X/9/a/9ac368cc8eafad165bbcf61b0263803d3b2dc2a7.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_002',
		url: 'https://linux.do/uploads/default/original/3X/1/6/16baef70ba80d438e4bb1907ec0c354d680e09df.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_003',
		url: 'https://linux.do/uploads/default/original/3X/2/7/27a55a1370c41f0736ba094bdc8866c6c2878c16.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_004',
		url: 'https://linux.do/uploads/default/original/3X/9/e/9eac534efec605f5a1ac3b2f08d768cfbb4c63a9.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_005',
		url: 'https://linux.do/uploads/default/original/3X/7/4/7493e87cae45656ac7997e8c79c852f9abc80454.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_006',
		url: 'https://linux.do/uploads/default/original/3X/5/9/596da26825d2a806bd1952b5231f24d212866c1b.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_007',
		url: 'https://linux.do/uploads/default/original/3X/c/0/c055b564a5b580ddfbf651df9a70feaec2b3b8e4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_008',
		url: 'https://linux.do/uploads/default/original/3X/9/e/9e137b2c72b77ee75454d737b5ad9d043dd49954.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_009',
		url: 'https://linux.do/uploads/default/original/3X/c/7/c756c0f079d25093ed6c7c2feaaa423ead63411c.png?v=12',
	},
	{
		size: '30x30',
		name: 'lark_085',
		url: 'https://linux.do/uploads/default/original/3X/1/3/133688dda7ae38a3ddbc9eda0ca99fa8ddbb2704.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_010',
		url: 'https://linux.do/uploads/default/original/3X/2/b/2b58793c54c273c2d3d40722c4def435543084b4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_011',
		url: 'https://linux.do/uploads/default/original/3X/0/b/0b73771da5b3dc534ad05f1b5fff24325fc0eff7.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_012',
		url: 'https://linux.do/uploads/default/original/3X/9/d/9d9e539ba33d272a5c6468cdb2fa7615695fa788.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_013',
		url: 'https://linux.do/uploads/default/original/3X/e/1/e1aad11157b14d04bc8056573ecb23b5a219d260.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_014',
		url: 'https://linux.do/uploads/default/original/3X/1/2/123defe5ac241618f3bb5246a727be77d996656d.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_015',
		url: 'https://linux.do/uploads/default/original/3X/d/3/d3347ade2d4baf8092696b33c3523e634923b4fe.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_016',
		url: 'https://linux.do/uploads/default/original/3X/2/1/21158038759f6a8630df8507f782a45a6caee004.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_017',
		url: 'https://linux.do/uploads/default/original/3X/7/7/7732425deb158037a8692c45381de35ca83105e6.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_018',
		url: 'https://linux.do/uploads/default/original/3X/7/1/7101ed3a9c047d318454b4eff91d74c06db5eaab.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_019',
		url: 'https://linux.do/uploads/default/original/3X/e/e/eeccf0c1ccda4a4f3b33b4bb502c14e80c324443.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_020',
		url: 'https://linux.do/uploads/default/original/3X/2/8/286824f9727de34e43b906346c0bdb0f854b1e2b.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_021',
		url: 'https://linux.do/uploads/default/original/3X/0/9/09077d62fc78be7a9c19a8c084a35eac8373d241.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_022',
		url: 'https://linux.do/uploads/default/original/3X/6/2/62e7b0ea68e56cc033f78527e62a825a6d9001f2.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_023',
		url: 'https://linux.do/uploads/default/original/3X/d/4/d4e4c57ba70bd38264f0677cf338fa8af3228fbd.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_024',
		url: 'https://linux.do/uploads/default/original/3X/9/c/9c2f3e1ce5982036af66b951a26231b7590e93d4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_025',
		url: 'https://linux.do/uploads/default/original/3X/e/4/e415f72201d585ac7ccc869a334048006d2b6b9d.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_026',
		url: 'https://linux.do/uploads/default/original/3X/a/d/ad2d245bbe71a05b0bd7a42f435d25524517c7ac.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_027',
		url: 'https://linux.do/uploads/default/original/3X/7/9/7992e06b38f76d7d55a8bc496fa6dd046ba1f0ad.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_028',
		url: 'https://linux.do/uploads/default/original/3X/4/4/448d0cb933ec8016797faef8c8dcfb8822e43326.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_029',
		url: 'https://linux.do/uploads/default/original/3X/8/4/84cd00fd735f11a57b193d62880f55b4ab835c7e.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_030',
		url: 'https://linux.do/uploads/default/original/3X/6/8/68b3471539dbbe40437b0881916feb2d9d4ad254.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_031',
		url: 'https://linux.do/uploads/default/original/3X/8/9/89870339101e10993ef1e55dd9e96f275a6a99f9.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_032',
		url: 'https://linux.do/uploads/default/original/3X/2/5/25936c19b7808540b4a46eb7aeddced05658ec77.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_033',
		url: 'https://linux.do/uploads/default/original/3X/d/f/dff9a29b33ccc0eeffe6d457cee58307246e28ab.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_034',
		url: 'https://linux.do/uploads/default/original/3X/8/b/8b42b74ab6f63dcd02b923cee5ab8f224f32954e.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_035',
		url: 'https://linux.do/uploads/default/original/3X/a/2/a268ad46209a864548c0439854c562d5a1a852e4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_036',
		url: 'https://linux.do/uploads/default/original/3X/4/9/49b2eba636dba687d98c4254bb00c682194f3556.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_037',
		url: 'https://linux.do/uploads/default/original/3X/5/3/5359fdcfeb8a92794fdf7e0a9e1b7002ba635765.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_038',
		url: 'https://linux.do/uploads/default/original/3X/5/3/535b871b10c649510280825c98e80ee1122613ec.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_039',
		url: 'https://linux.do/uploads/default/original/3X/9/8/98939cb96a8df85af0efdaf02dcc144265e64703.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_040',
		url: 'https://linux.do/uploads/default/original/3X/3/a/3a5fcb80663d73c1f116527c17de7cad37b72c49.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_041',
		url: 'https://linux.do/uploads/default/original/3X/4/0/40cc7fe068c66b38c5e58ee8b59879f572dcd2ca.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_042',
		url: 'https://linux.do/uploads/default/original/3X/e/6/e69395f0a9f391ca3c296aeddf510d0fb1d28fdf.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_043',
		url: 'https://linux.do/uploads/default/original/3X/1/2/123e2d16a27491073fd90994fcd2820a48b2eb1d.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_044',
		url: 'https://linux.do/uploads/default/original/3X/4/d/4d101bae8975480e4c81969242c6db771ccf29df.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_045',
		url: 'https://linux.do/uploads/default/original/3X/6/8/687dca2210abafbcaaf211e27a013c1c0d7d480c.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_046',
		url: 'https://linux.do/uploads/default/original/3X/1/4/14bca5d4cdaca743d0da8bc7f3b23146b53bc534.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_047',
		url: 'https://linux.do/uploads/default/original/3X/c/d/cd555f2a5f605873e85b12ebf5e20affeb86817b.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_048',
		url: 'https://linux.do/uploads/default/original/3X/7/d/7d5173acb48b6662934d93d15ccf03bc4eb4fe1e.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_049',
		url: 'https://linux.do/uploads/default/original/3X/b/7/b774ed3e1792a0c345c3dc6b405398fc330476c4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_050',
		url: 'https://linux.do/uploads/default/original/3X/6/3/63c1a091c6a7a3a4ba09f79d3df61b5258d1da14.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_062',
		url: 'https://linux.do/uploads/default/original/3X/6/4/644937964bfb3b7ff9519a8c789fba156bc51493.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_063',
		url: 'https://linux.do/uploads/default/original/3X/9/7/977e25c3bb0bb2ffffd7680ef75de860c9bc8eeb.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_064',
		url: 'https://linux.do/uploads/default/original/3X/f/a/fa08552ff47b7347fe769ea71e251784fe46e9c4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_065',
		url: 'https://linux.do/uploads/default/original/3X/8/d/8ddf6f88c399106b30f08bc6ae594dba19e8da36.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_066',
		url: 'https://linux.do/uploads/default/original/3X/d/c/dccf34dbec6856992ab133e61a1f35417caf5f94.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_067',
		url: 'https://linux.do/uploads/default/original/3X/1/6/16cd502b6c1d42d6d929788d47a96e50313b361f.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_068',
		url: 'https://linux.do/uploads/default/original/3X/a/7/a79256841becf6fc218cf13ed7c9708d2846f472.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_069',
		url: 'https://linux.do/uploads/default/original/3X/1/b/1b279f1106ef55973ae2df3a41edda04181163f6.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_070',
		url: 'https://linux.do/uploads/default/original/3X/1/e/1e8646c269ac7a1cea631b1a2fe107a4b0137dd4.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_071',
		url: 'https://linux.do/uploads/default/original/3X/4/f/4fcf98aa20e5148d8f0dd1e117d99ad52fe7787a.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_072',
		url: 'https://linux.do/uploads/default/original/3X/f/b/fbdca3a08e2eb36d408a9f723251132a6e1a4a1d.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_073',
		url: 'https://linux.do/uploads/default/original/3X/e/f/efcf23577412c17df6354df84eae836ad324d3fc.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_074',
		url: 'https://linux.do/uploads/default/original/3X/4/0/40f2d01d50e90a29680636aa5b5b6808fe4e496b.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_075',
		url: 'https://linux.do/uploads/default/original/3X/b/2/b29012e6751baac99a0b364978e2ba6c68696bb0.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_076',
		url: 'https://linux.do/uploads/default/original/3X/8/e/8eb5b83342386cac1dcf7ee4de785540eb85b941.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_077',
		url: 'https://linux.do/uploads/default/original/3X/0/d/0d84801a6c000b4724a4f998ae2cebbb75088672.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_078',
		url: 'https://linux.do/uploads/default/original/3X/e/8/e8342efcc78faa5225bc94fdc50d595b35de226a.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_079',
		url: 'https://linux.do/uploads/default/original/3X/0/3/03493b5fee0ad65939b223bcb99256c2ad3f92cf.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_080',
		url: 'https://linux.do/uploads/default/original/3X/6/0/6010085f85bbd33ec476d908a3adedf43bf806d2.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_081',
		url: 'https://linux.do/uploads/default/original/3X/4/7/472396c3c1fdc62031460f52fa57e70656559956.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_082',
		url: 'https://linux.do/uploads/default/original/3X/e/8/e8ed47702a901d932ce0f2c926006c569777acae.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_083',
		url: 'https://linux.do/uploads/default/original/3X/8/3/839487b3bbfe38ea8a6d69115c2b18e336c776aa.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_084',
		url: 'https://linux.do/uploads/default/original/3X/d/a/da2b0f67a66746f0702044254460f5f210159dfe.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_085',
		url: 'https://linux.do/uploads/default/original/3X/4/b/4bfbebdb5da3afb04e73813042a2645dea7895a3.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_086',
		url: 'https://linux.do/uploads/default/original/3X/4/0/4035794fd9995594b024ca6695de918567c5b192.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_087',
		url: 'https://linux.do/uploads/default/original/3X/2/e/2e09f3a3c7b27eacbabe9e9614b06b88d5b06343.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_088',
		url: 'https://linux.do/uploads/default/original/3X/8/8/8842b4bbda39465fefb2a5cee47c8b203463e327.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_089',
		url: 'https://linux.do/uploads/default/original/3X/c/2/c20aca50f9432ad01fdaf454e2013083be11909c.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_090',
		url: 'https://linux.do/uploads/default/original/3X/0/e/0eb0e2df1d8287c00069e1bb906f65a7e6f8ac1f.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_091',
		url: 'https://linux.do/uploads/default/original/3X/f/c/fcb760df48754f55cd9030370300880cddc30aeb.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_092',
		url: 'https://linux.do/uploads/default/original/3X/6/d/6d1bcb4bdba18ec87caac87e5c944d81244c0925.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_093',
		url: 'https://linux.do/uploads/default/original/3X/1/7/17e9f52f1b3f19e5fcf1e30b0bef7154b9cb25e9.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_094',
		url: 'https://linux.do/uploads/default/original/3X/d/8/d84a7737da89e36a682519cc53dc36869dc8324a.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_095',
		url: 'https://linux.do/uploads/default/original/3X/d/6/d687f7716a72d08b5ab44bf515b4b47ddf973a16.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_096',
		url: 'https://linux.do/uploads/default/original/3X/9/1/91c4bdc5b31022de2047b0e326f85aac696a61d8.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_097',
		url: 'https://linux.do/uploads/default/original/3X/9/9/992ffdfd94f164debe2ff1ffd686eb9b6d886c30.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_098',
		url: 'https://linux.do/uploads/default/original/3X/a/b/ab4d09d173fe9d726a7df370527e3bb11b86ac37.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_099',
		url: 'https://linux.do/uploads/default/original/3X/9/e/9e07307cddc9a8e1b17374d688dcd9cac0009b36.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_100',
		url: 'https://linux.do/uploads/default/original/3X/0/8/083d87100f8608832766302d52e90c66bfa7b55e.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_101',
		url: 'https://linux.do/uploads/default/original/3X/d/d/ddf9dab71979b328b8cc99a110961278b31af15f.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_102',
		url: 'https://linux.do/uploads/default/original/3X/c/1/c1e30e625a80f2c4e38d15051adc0fbff0cdac85.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_103',
		url: 'https://linux.do/uploads/default/original/3X/4/9/4932179ffb43027d3482ff0a8e79ad3c9f124675.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_104',
		url: 'https://linux.do/uploads/default/original/3X/e/e/ee4698ca2806e680bf8710a138964433caeec7db.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_105',
		url: 'https://linux.do/uploads/default/original/3X/0/4/04b9b300e3259e61fe2e9b6e1a291112fece7aa5.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_106',
		url: 'https://linux.do/uploads/default/original/3X/4/5/45cf9833729d3f67e4b71327c07bda302ac3f792.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_107',
		url: 'https://linux.do/uploads/default/original/3X/6/c/6c0346f696e90c6f804ade9f9d578c8c79c99aac.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_108',
		url: 'https://linux.do/uploads/default/original/3X/a/1/a1ec5ef51c85ebabebe5102b00a1a4caeb08be63.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_109',
		url: 'https://linux.do/uploads/default/original/3X/b/7/b75001317cf515737019777e8a6ed35b5b46ca6c.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_110',
		url: 'https://linux.do/uploads/default/original/3X/0/1/0194cea00dae49fd82321825b52d96e1f8f47732.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_111',
		url: 'https://linux.do/uploads/default/original/3X/b/5/b52e429fb2a84f8e72169c358f00b20e271d9f83.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_112',
		url: 'https://linux.do/uploads/default/original/3X/c/9/c9aa6ca75dbffd21308721ce156da371e82b47f9.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_113',
		url: 'https://linux.do/uploads/default/original/3X/1/c/1cadebeaf0cd36af11665ffa5802ba1c5b143be9.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_114',
		url: 'https://linux.do/uploads/default/original/3X/d/d/dd93786f2a24352b65e23f81d2c24c1a41439cf0.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_115',
		url: 'https://linux.do/uploads/default/original/3X/1/e/1e79d50d73b1afaeffe39574e92154d5d2878787.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_116',
		url: 'https://linux.do/uploads/default/original/3X/d/a/daf75362acc5e46c813a77d8bd143e4e20dd89e5.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_117',
		url: 'https://linux.do/uploads/default/original/3X/f/c/fcca64230d5d15b933b3b9db491f9d3516909b62.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_118',
		url: 'https://linux.do/uploads/default/original/3X/1/8/189ed0fa3c3c01fdf1a99e836f1fa921f679b286.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_119',
		url: 'https://linux.do/uploads/default/original/3X/1/2/1267794a9888419b4d72a2e92162dcb10c08d740.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_120',
		url: 'https://linux.do/uploads/default/original/3X/2/b/2b20054bfb140ededbc4a5b94d529960ab49522a.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_121',
		url: 'https://linux.do/uploads/default/original/3X/5/4/54c6102be172ff5b326edcff59e4ed6485495218.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_122',
		url: 'https://linux.do/uploads/default/original/3X/f/b/fb9a3fe91bb52c30496dd41c739bd829511498fe.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_123',
		url: 'https://linux.do/uploads/default/original/3X/0/6/069a4f21d927aac0db15bb2304ca29f5bdd0f733.png?v=12',
	},
	{
		size: '30x30',
		name: 'tieba_124',
		url: 'https://linux.do/uploads/default/original/3X/3/7/372798490ea3b5ca4dac38233413355c6c8175ce.png?v=12',
	},
];

export default {
	data() {
		return {
			emojiTimer: null,
		};
	},
	mounted() {
		this.setupEmojiButton();
	},
	methods: {
		setupEmojiButton() {
			this.emojiTimer = setInterval(() => {
				var editor = document.querySelector('.d-editor-button-bar');
				if (!document.querySelector('.emoji-picker-button') && editor) {
					var emojiButton = document.createElement('button');
					emojiButton.classList.add('btn', 'no-text', 'btn-icon', 'emoji', 'emoji-picker-button');
					emojiButton.title = '插入贴吧表情包';
					emojiButton.innerHTML =
						"<svg class='fa d-icon d-icon-far-face-smile svg-icon svg-string' xmlns='http://www.w3.org/2000/svg'><use href='#far-face-smile'></use></svg>";
					editor.appendChild(emojiButton);
					emojiButton.addEventListener('click', function () {
						var emojiPicker = document.createElement('div');
						emojiPicker.className = 'emojiPicker';
						var emojiSetHtml = emojiSet
							.map(
								(emo) =>
									`<img src="${emo.url}" name="${emo.name}" url="${emo.url}" alt="${emo.size}" onclick="insertEmoji(event)"/>`,
							)
							.join('');
						emojiPicker.innerHTML = emojiSetHtml;
						emojiPicker.style.position = 'absolute';
						emojiPicker.style.background = '#FFF';
						emojiPicker.style.border = '1px solid #ddd';
						emojiPicker.style.padding = '10px';
						emojiPicker.style.height = document.querySelector('.d-editor-textarea-column').getBoundingClientRect().height + 'px';
						if (document.body.contains(document.querySelector('.emojiPicker'))) {
							document.querySelector('.emojiPicker').remove();
						} else {
							var previewWrapper = document.querySelector('.d-editor-preview-wrapper');
							if (previewWrapper) {
								previewWrapper.prepend(emojiPicker);
							}
						}
						emojiPicker.addEventListener('click', function (e) {
							if (e.target.tagName === 'IMG') {
								var textArea = document.querySelector('.d-editor-input');
								if (!textArea) {
									alert('找不到输入框');
									return;
								}
								// var emojiMarkdown = `![${e.target.name}|${e.target.alt}](${e.target.src})`;
								var emojiMarkdown = `:${e.target.name}: `;

								// 在光标位置插入表情包
								var startPos = textArea.selectionStart;
								var endPos = textArea.selectionEnd;
								textArea.value =
									textArea.value.substring(0, startPos) +
									emojiMarkdown +
									textArea.value.substring(endPos, textArea.value.length);
								// 触发输入事件
								var event = new Event('input', {
									bubbles: true,
									cancelable: true,
								});
								textArea.dispatchEvent(event);
								// 隐藏选择器
								emojiPicker.remove();
							}
						});
					});
				}
			}, 100);
		},
	},
	beforeUnmount() {
		if (this.emojiTimer) {
			clearInterval(this.emojiTimer);
			this.emojiTimer = null;
		}
	},
	beforeDestroy() {
		if (this.emojiTimer) {
			clearInterval(this.emojiTimer);
			this.emojiTimer = null;
		}
	},
};

// 为了保持原有功能，保留全局的表情插入函数
window.insertEmoji = function (event) {
	var textArea = document.querySelector('.d-editor-input');
	if (!textArea) {
		alert('找不到输入框');
		return;
	}
	var emojiMarkdown = `:${event.target.getAttribute('name')}: `;

	// 在光标位置插入表情包
	var startPos = textArea.selectionStart;
	var endPos = textArea.selectionEnd;
	textArea.value =
		textArea.value.substring(0, startPos) + emojiMarkdown + textArea.value.substring(endPos, textArea.value.length);

	// 触发输入事件
	var inputEvent = new Event('input', {
		bubbles: true,
		cancelable: true,
	});
	textArea.dispatchEvent(inputEvent);

	// 隐藏选择器
	if (document.querySelector('.emojiPicker')) {
		document.querySelector('.emojiPicker').remove();
	}
};
</script>
